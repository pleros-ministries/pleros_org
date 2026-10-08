import {
  normaliseMinistryNote,
  normaliseMinistryNumbers,
  type MinistryFieldKey,
  type MinistryNumbers,
  type NumberRules,
} from "./ministry-report";

/**
 * Rules for one ministry activity: the kinds a member can log, which number
 * fields each kind shows and requires, the outreach modes and platforms, and
 * how an activity sent from the form is read. Pure so the stepper, the server
 * action, the staff tables and the export all use the same lists.
 */

export type ActivityKind =
  | "outreach"
  | "teaching_meeting"
  | "prayer_meeting"
  | "follow_up"
  | "church_service"
  | "other";

export type OutreachMode = "online" | "offline" | "both";

/** Which people step a kind has: new people met, existing people followed up, or none. */
export type ActivityPeople = "met" | "follow_up" | "none";

export const ACTIVITY_TITLE_MAX = 80;
/** A physical location or an "other" platform name. */
export const ACTIVITY_PLACE_MAX = 120;
/** Activities one member may log for a single day. */
export const ACTIVITIES_PER_DAY_MAX = 10;

export type ActivityKindConfig = {
  key: ActivityKind;
  label: string;
  /** One line under the choice in the form. */
  hint: string;
  /** What the title field asks for; null when the kind has no title. */
  titleLabel: string | null;
  titleRequired: boolean;
  /** Whether the kind asks where it happened (outreach asks through its mode). */
  asksLocation: boolean;
  people: ActivityPeople;
  /** Fields shown and required. Outreach adds the reached fields from its mode (see `activityFields`). */
  shown: readonly MinistryFieldKey[];
  required: readonly MinistryFieldKey[];
};

const MEETING_FIELDS: readonly MinistryFieldKey[] = ["attendance", "saved", "filled", "healed"];

/** Every kind a member can log, in the order the form offers them. */
export const ACTIVITY_KINDS: readonly ActivityKindConfig[] = [
  {
    key: "outreach",
    label: "Outreach",
    hint: "Sharing the gospel online or in person",
    titleLabel: null,
    titleRequired: false,
    asksLocation: false,
    people: "met",
    shown: ["saved", "notSaved", "filled", "healed", "followUps"],
    required: [],
  },
  {
    key: "teaching_meeting",
    label: "Teaching meeting",
    hint: "A Bible study, class or training you led or hosted",
    titleLabel: "Name of the meeting",
    titleRequired: false,
    asksLocation: true,
    people: "none",
    shown: MEETING_FIELDS,
    required: ["attendance"],
  },
  {
    key: "prayer_meeting",
    label: "Prayer meeting",
    hint: "A prayer gathering you led or joined",
    titleLabel: "Name of the meeting",
    titleRequired: false,
    asksLocation: true,
    people: "none",
    shown: MEETING_FIELDS,
    required: ["attendance"],
  },
  {
    key: "follow_up",
    label: "Follow-up",
    hint: "Calls, visits or messages to people you have met",
    titleLabel: null,
    titleRequired: false,
    asksLocation: false,
    people: "follow_up",
    shown: ["followUps", "saved", "filled", "healed"],
    required: [],
  },
  {
    key: "church_service",
    label: "Church service",
    hint: "A service you ministered in",
    titleLabel: "Name of the service",
    titleRequired: false,
    asksLocation: true,
    people: "none",
    shown: MEETING_FIELDS,
    required: ["attendance"],
  },
  {
    key: "other",
    label: "Something else",
    hint: "Any other ministry activity",
    titleLabel: "What was it?",
    titleRequired: true,
    asksLocation: true,
    people: "none",
    shown: ["attendance", "saved", "filled", "healed", "followUps"],
    required: [],
  },
];

export function isActivityKind(value: unknown): value is ActivityKind {
  return ACTIVITY_KINDS.some((kind) => kind.key === value);
}

export function activityKindConfig(kind: ActivityKind): ActivityKindConfig {
  const config = ACTIVITY_KINDS.find((item) => item.key === kind);
  if (!config) throw new Error(`Unknown activity kind: ${kind}`);
  return config;
}

export function activityKindLabel(kind: ActivityKind): string {
  return activityKindConfig(kind).label;
}

export const OUTREACH_MODES: ReadonlyArray<{ key: OutreachMode; label: string }> = [
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "both", label: "Both" },
];

export function isOutreachMode(value: unknown): value is OutreachMode {
  return OUTREACH_MODES.some((mode) => mode.key === value);
}

/** How an outreach reached people, written out for cards and tables. */
export function outreachModeLabel(mode: OutreachMode): string {
  return mode === "both" ? "Online and offline" : mode === "online" ? "Online" : "Offline";
}

/**
 * The number fields a kind shows and requires. Outreach reads its reached
 * fields from the mode: online asks for people reached online, offline for
 * people reached offline, both for both.
 */
export function activityFields(kind: ActivityKind, mode: OutreachMode | null): NumberRules {
  const config = activityKindConfig(kind);
  if (kind !== "outreach") return { shown: config.shown, required: config.required };
  const reached: MinistryFieldKey[] =
    mode === "online"
      ? ["reachedOnline"]
      : mode === "offline"
        ? ["reachedOffline"]
        : mode === "both"
          ? ["reachedOnline", "reachedOffline"]
          : [];
  return { shown: [...reached, ...config.shown], required: reached };
}

// ─── Online platforms ──────────────────────────────────────────────────────

/** Where online outreach happens; `other` takes a free-text name stored as `other:<name>`. */
export const OUTREACH_PLATFORMS: ReadonlyArray<{ key: string; label: string }> = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "x", label: "X (Twitter)" },
  { key: "telegram", label: "Telegram" },
  { key: "youtube", label: "YouTube" },
  { key: "phone", label: "Phone call or SMS" },
  { key: "video_call", label: "Video call" },
  { key: "other", label: "Other" },
];

const OTHER_PREFIX = "other:";

/** Splits a stored platform into its list key and, for `other`, the name given. */
export function parsePlatform(
  platform: string | null,
): { key: string; detail: string | null } | null {
  if (!platform) return null;
  if (platform.startsWith(OTHER_PREFIX)) {
    return { key: "other", detail: platform.slice(OTHER_PREFIX.length).trim() || null };
  }
  if (OUTREACH_PLATFORMS.some((item) => item.key === platform)) {
    return { key: platform, detail: null };
  }
  // A key no longer in the list still shows as it was stored.
  return { key: "other", detail: platform };
}

export function platformLabel(platform: string | null): string | null {
  const parsed = parsePlatform(platform);
  if (!parsed) return null;
  if (parsed.detail) return parsed.detail;
  return OUTREACH_PLATFORMS.find((item) => item.key === parsed.key)?.label ?? parsed.key;
}

// ─── Display ───────────────────────────────────────────────────────────────

export type ActivityPlace = {
  mode: OutreachMode | null;
  platform: string | null;
  location: string | null;
};

/** "Online · WhatsApp", "Offline · Ikeja market", "Online and offline · WhatsApp · Ikeja market", or null. */
export function activityWhere(activity: ActivityPlace): string | null {
  const parts = [
    activity.mode ? outreachModeLabel(activity.mode) : null,
    platformLabel(activity.platform),
    activity.location,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** One line for tables: "Outreach · Online · WhatsApp", "Teaching meeting · Youth fellowship". */
export function activitySummary(
  activity: ActivityPlace & { kind: ActivityKind; title: string | null },
): string {
  return [activityKindLabel(activity.kind), activity.title, activityWhere(activity)]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

/** Groups rows by their day, keeping the order they came in. */
export function groupActivitiesByDay<T extends { activityDate: string }>(
  rows: T[],
): Map<string, T[]> {
  const days = new Map<string, T[]>();
  for (const row of rows) {
    const list = days.get(row.activityDate);
    if (list) list.push(row);
    else days.set(row.activityDate, [row]);
  }
  return days;
}

// ─── Reading an activity from the form ─────────────────────────────────────

export type ActivityInput = MinistryNumbers & {
  kind: ActivityKind;
  title: string | null;
  mode: OutreachMode | null;
  /** A key from `OUTREACH_PLATFORMS`, or `other:<name>`. */
  platform: string | null;
  location: string | null;
  note: string | null;
};

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function isBlank(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

/**
 * Reads untrusted form values for one activity. The kind decides which
 * fields are read; anything a kind does not ask for is dropped or zeroed.
 * For a follow-up, "Follow-ups made" defaults to the number of people rows
 * sent (`peopleCount`) when left blank.
 */
export function normaliseActivityInput(input: {
  kind?: unknown;
  title?: unknown;
  mode?: unknown;
  platform?: unknown;
  platformOther?: unknown;
  location?: unknown;
  note?: unknown;
  values?: Partial<Record<MinistryFieldKey, unknown>>;
  peopleCount?: number;
}): Result<ActivityInput> {
  if (!isActivityKind(input.kind)) return fail("Choose what you did.");
  const config = activityKindConfig(input.kind);

  let title: string | null = null;
  if (config.titleLabel) {
    const given = text(input.title);
    if (config.titleRequired && !given) {
      return fail("Give this activity a short name.");
    }
    if (given.length > ACTIVITY_TITLE_MAX) {
      return fail(`Keep the name under ${ACTIVITY_TITLE_MAX} characters.`);
    }
    title = given || null;
  }

  const place = text(input.location);
  if (place.length > ACTIVITY_PLACE_MAX) {
    return fail(`Keep the place under ${ACTIVITY_PLACE_MAX} characters.`);
  }

  let mode: OutreachMode | null = null;
  let platform: string | null = null;
  let location: string | null = null;

  if (config.key === "outreach") {
    if (!isOutreachMode(input.mode)) return fail("Choose online, offline or both.");
    mode = input.mode;
    if (mode !== "offline") {
      const key = text(input.platform);
      const known = OUTREACH_PLATFORMS.find((item) => item.key === key);
      if (!known) return fail("Choose the platform.");
      if (known.key === "other") {
        const detail = text(input.platformOther);
        if (!detail) return fail("Say which platform.");
        if (detail.length > ACTIVITY_PLACE_MAX) {
          return fail(`Keep the platform name under ${ACTIVITY_PLACE_MAX} characters.`);
        }
        platform = `${OTHER_PREFIX}${detail}`;
      } else {
        platform = known.key;
      }
    }
    if (mode !== "online") {
      if (!place) return fail("Enter where you were.");
      location = place;
    }
  } else if (config.asksLocation) {
    location = place || null;
  }

  const values: Partial<Record<MinistryFieldKey, unknown>> = { ...(input.values ?? {}) };
  if (config.key === "follow_up" && isBlank(values.followUps) && input.peopleCount != null) {
    values.followUps = String(input.peopleCount);
  }
  const numbers = normaliseMinistryNumbers(values, activityFields(config.key, mode));
  if (!numbers.ok) return numbers;
  const note = normaliseMinistryNote(input.note);
  if (!note.ok) return note;

  return {
    ok: true,
    value: {
      ...numbers.value,
      kind: config.key,
      title,
      mode,
      platform,
      location,
      note: note.value,
    },
  };
}
