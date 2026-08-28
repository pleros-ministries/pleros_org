export type SogpChannelReminder = {
  key: string;
  kind: "preparation" | "track_release" | "live_class";
  message: string;
};

export type SogpPrayerWatchPushCandidate = {
  key: string;
  title: string;
  body: string;
  url: string;
};

export function buildSogpPrayerWatchPushCandidate(input: {
  now: Date;
  userId: string;
  cohortId: number;
  cohortStatus: string;
}): SogpPrayerWatchPushCandidate | null {
  if (input.cohortStatus !== "preparing" && input.cohortStatus !== "active") {
    return null;
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(input.now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  if (value("hour") !== "05" || value("minute") !== "20") return null;
  const dateKey = `${value("year")}-${value("month")}-${value("day")}`;
  const path = input.cohortStatus === "preparing" ? "/dashboard/pre-sogp" : "/dashboard/sogp";
  return {
    key: `sogp:${input.cohortId}:prayer:${input.userId}:${dateKey}`,
    title: "Prayer Watch begins in 10 minutes",
    body: "Join the 5:30 am Prayer Watch on Pleros Live.",
    url: `${path}?date=${dateKey}`,
  };
}

type ReminderInput = {
  now: Date;
  cohort: {
    id: number;
    title: string;
    status: string;
    startsAt: Date;
  };
  tracks: Array<{
    id: number;
    dayNumber: number;
    releaseAt: Date;
    title: string;
  }>;
  liveClasses: Array<{
    id: number;
    title: string;
    startsAt: Date;
    youtubeLiveUrl: string | null;
  }>;
};

export function buildSogpChannelReminderCandidates(
  input: ReminderInput,
): SogpChannelReminder[] {
  const events: SogpChannelReminder[] = [];
  const oneDayAgo = new Date(input.now.getTime() - 24 * 60 * 60_000);

  for (const track of input.tracks) {
    if (track.releaseAt <= input.now && track.releaseAt > oneDayAgo) {
      events.push({
        key: `sogp:${input.cohort.id}:track:${track.id}:released`,
        kind: "track_release",
        message: `Day ${track.dayNumber} is ready: ${track.title}\n\nOpen your dashboard: https://pleros.org/dashboard/sogp`,
      });
    }
  }

  for (const liveClass of input.liveClasses) {
    const timeUntilClass = liveClass.startsAt.getTime() - input.now.getTime();
    const suffix = liveClass.youtubeLiveUrl
      ? `\n\nWatch: ${liveClass.youtubeLiveUrl}`
      : "\n\nYour joining link will appear in the SOGP dashboard.";
    if (timeUntilClass > 0 && timeUntilClass <= 24 * 60 * 60_000) {
      events.push({
        key: `sogp:${input.cohort.id}:live:${liveClass.id}:24h`,
        kind: "live_class",
        message: `${liveClass.title} starts in 24 hours.${suffix}`,
      });
    }
  }

  if (input.cohort.status === "preparing") {
    const days = Math.ceil(
      (input.cohort.startsAt.getTime() - input.now.getTime()) / 86_400_000,
    );
    if (days > 0) {
      const dayKey = input.now.toISOString().slice(0, 10);
      events.push({
        key: `sogp:${input.cohort.id}:preparation:${dayKey}`,
        kind: "preparation",
        message: `${days} day${days === 1 ? "" : "s"} until ${input.cohort.title} begins. Prepare with today's resources in your dashboard.\n\nhttps://pleros.org/dashboard/sogp`,
      });
    }
  }

  return events;
}
