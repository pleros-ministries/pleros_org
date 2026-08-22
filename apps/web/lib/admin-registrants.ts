import { normalizeEmail } from "./welcome-flow";

export type AdminRegistrantAccountStatus = "ppc_account" | "welcome_only";

export type AdminRegistrantSource = "ppc" | "welcome";

export type AdminRegistrantPpcSummary = {
  currentLevel: number;
  progressPercent: number;
  currentLesson: string;
  graduationStatus: string;
};

export type AdminRegistrantPrayerWatchSummary = {
  attendedDays: number;
  lastAttendedDate: string | null;
};

export type AdminRegistrantPodcastSummary = {
  listenedEpisodes: number;
  lastListenedAt: string | null;
};

export type AdminRegistrantSummary = {
  id: string;
  userId: string | null;
  leadId: number | null;
  name: string;
  email: string;
  sources: AdminRegistrantSource[];
  sourceLabel: string;
  accountStatus: AdminRegistrantAccountStatus;
  ppc: AdminRegistrantPpcSummary | null;
  prayerWatch: AdminRegistrantPrayerWatchSummary;
  bibleReadingStatus: "not_tracked";
  podcastStatus: "not_tracked" | "tracked";
  podcast: AdminRegistrantPodcastSummary;
  createdAt: string;
  updatedAt: string | null;
};

export type AdminRegistrantMergeUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
  currentLevel: number;
  progressPercent: number;
  currentLesson: string;
  graduationStatus: string;
};

export type AdminRegistrantMergeLead = {
  id: number;
  name: string | null;
  email: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type AdminRegistrantMergePrayerWatch = {
  userId: string;
  attendedDate: string;
};

export type AdminRegistrantMergePodcastProgress = {
  userId: string;
  listenedAt: Date | string;
};

function serializeDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function buildSourceLabel(sources: AdminRegistrantSource[]) {
  if (sources.includes("ppc") && sources.includes("welcome")) {
    return "PPC + welcome";
  }

  return sources.includes("ppc") ? "PPC" : "Welcome";
}

export function buildAdminRegistrantSummaries(input: {
  users: AdminRegistrantMergeUser[];
  leads: AdminRegistrantMergeLead[];
  prayerWatchRows: AdminRegistrantMergePrayerWatch[];
  podcastRows?: AdminRegistrantMergePodcastProgress[];
}): AdminRegistrantSummary[] {
  const byEmail = new Map<string, AdminRegistrantSummary>();
  const prayerWatchByUserId = new Map<string, AdminRegistrantPrayerWatchSummary>();
  const podcastByUserId = new Map<string, AdminRegistrantPodcastSummary>();

  for (const row of input.prayerWatchRows) {
    const current = prayerWatchByUserId.get(row.userId) ?? {
      attendedDays: 0,
      lastAttendedDate: null,
    };

    current.attendedDays += 1;
    if (!current.lastAttendedDate || row.attendedDate > current.lastAttendedDate) {
      current.lastAttendedDate = row.attendedDate;
    }

    prayerWatchByUserId.set(row.userId, current);
  }

  for (const row of input.podcastRows ?? []) {
    const listenedAt = serializeDate(row.listenedAt);
    const current = podcastByUserId.get(row.userId) ?? {
      listenedEpisodes: 0,
      lastListenedAt: null,
    };

    current.listenedEpisodes += 1;
    if (!current.lastListenedAt || listenedAt > current.lastListenedAt) {
      current.lastListenedAt = listenedAt;
    }

    podcastByUserId.set(row.userId, current);
  }

  for (const lead of input.leads) {
    const email = normalizeEmail(lead.email);
    const createdAt = serializeDate(lead.createdAt);

    byEmail.set(email, {
      id: `welcome-lead-${lead.id}`,
      userId: null,
      leadId: lead.id,
      name: lead.name?.trim() || "Not provided",
      email,
      sources: ["welcome"],
      sourceLabel: "Welcome",
      accountStatus: "welcome_only",
      ppc: null,
      prayerWatch: { attendedDays: 0, lastAttendedDate: null },
      bibleReadingStatus: "not_tracked",
      podcastStatus: "not_tracked",
      podcast: { listenedEpisodes: 0, lastListenedAt: null },
      createdAt,
      updatedAt: serializeDate(lead.updatedAt),
    });
  }

  for (const user of input.users) {
    const email = normalizeEmail(user.email);
    const existing = byEmail.get(email);
    const sources: AdminRegistrantSource[] = existing
      ? Array.from(new Set<AdminRegistrantSource>([...existing.sources, "ppc"]))
      : ["ppc"];
    const prayerWatch = prayerWatchByUserId.get(user.id) ?? {
      attendedDays: 0,
      lastAttendedDate: null,
    };
    const podcast = podcastByUserId.get(user.id) ?? {
      listenedEpisodes: 0,
      lastListenedAt: null,
    };

    byEmail.set(email, {
      id: user.id,
      userId: user.id,
      leadId: existing?.leadId ?? null,
      name: user.name || existing?.name || "Not provided",
      email,
      sources,
      sourceLabel: buildSourceLabel(sources),
      accountStatus: "ppc_account",
      ppc: {
        currentLevel: user.currentLevel,
        progressPercent: user.progressPercent,
        currentLesson: user.currentLesson,
        graduationStatus: user.graduationStatus,
      },
      prayerWatch,
      bibleReadingStatus: "not_tracked",
      podcastStatus: podcast.listenedEpisodes > 0 ? "tracked" : "not_tracked",
      podcast,
      createdAt: serializeDate(user.createdAt),
      updatedAt: existing?.updatedAt ?? null,
    });
  }

  return Array.from(byEmail.values()).sort((a, b) => {
    if (a.accountStatus !== b.accountStatus) {
      return a.accountStatus === "ppc_account" ? -1 : 1;
    }

    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
