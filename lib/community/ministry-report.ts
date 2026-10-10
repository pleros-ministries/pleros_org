import { shiftDate } from "../sogp/daily-date";

/**
 * Rules shared by every ministry activity: the number fields, the reporting
 * window, the staff date ranges and the Pleros activity compiled beside a
 * day. Pure so they are unit-tested and so the form, tables and export all
 * read the same field list. Which fields a kind of activity shows lives in
 * `ministry-activities.ts`.
 */

/** The numbers an activity can carry, in the order they are shown everywhere. */
export const MINISTRY_FIELDS = [
  { key: "reachedOnline", label: "People reached online", short: "Online" },
  { key: "reachedOffline", label: "People reached offline", short: "Offline" },
  { key: "attendance", label: "People present", short: "Present" },
  { key: "saved", label: "Gave their lives to Christ", short: "Saved" },
  { key: "notSaved", label: "Not saved", short: "Not saved" },
  { key: "filled", label: "Filled with the Holy Spirit", short: "Filled" },
  { key: "healed", label: "Healed", short: "Healed" },
  { key: "followUps", label: "Follow-ups made", short: "Follow-ups" },
] as const;

export type MinistryFieldKey = (typeof MINISTRY_FIELDS)[number]["key"];
export type MinistryNumbers = Record<MinistryFieldKey, number>;

/** Which number fields a form shows, and which of those must be given. */
export type NumberRules = {
  shown: readonly MinistryFieldKey[];
  required: readonly MinistryFieldKey[];
};

export const MINISTRY_COUNT_MAX = 100_000;
export const MINISTRY_NOTE_MAX = 500;
/** An activity can be added or corrected for today and this many earlier days. */
export const MINISTRY_LATE_DAYS = 7;
export const MINISTRY_WRITE_WINDOW_MESSAGE =
  `Reports can be added or corrected for today and the previous ${MINISTRY_LATE_DAYS} Lagos days. Earlier days are view only.`;

export function emptyMinistryNumbers(): MinistryNumbers {
  return {
    reachedOnline: 0,
    reachedOffline: 0,
    attendance: 0,
    saved: 0,
    notSaved: 0,
    filled: 0,
    healed: 0,
    followUps: 0,
  };
}

export function ministryFieldLabel(key: MinistryFieldKey): string {
  return MINISTRY_FIELDS.find((field) => field.key === key)?.label ?? key;
}

function parseCount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  return /^\d+$/.test(text) ? Number(text) : null;
}

/**
 * Reads untrusted number values. Only the fields in `rules.shown` are read;
 * anything else is forced to 0 whatever was sent. Required fields must be
 * given (0 is fine); the rest default to 0 when left blank.
 */
export function normaliseMinistryNumbers(
  input: Partial<Record<MinistryFieldKey, unknown>>,
  rules: NumberRules,
): { ok: true; value: MinistryNumbers } | { ok: false; error: string } {
  const numbers = emptyMinistryNumbers();

  for (const field of MINISTRY_FIELDS) {
    if (!rules.shown.includes(field.key)) continue;
    const raw = input[field.key];
    const blank = raw == null || (typeof raw === "string" && raw.trim() === "");
    if (blank) {
      if (rules.required.includes(field.key)) {
        return {
          ok: false,
          error: `Enter a number for "${field.label}". Use 0 if there were none.`,
        };
      }
      continue;
    }
    const count = parseCount(raw);
    if (count === null || count < 0 || count > MINISTRY_COUNT_MAX) {
      return {
        ok: false,
        error: `"${field.label}" must be a whole number from 0 to ${MINISTRY_COUNT_MAX.toLocaleString("en-GB")}.`,
      };
    }
    numbers[field.key] = count;
  }

  return { ok: true, value: numbers };
}

/** Reads an optional free-text note: trimmed, empty becomes null, capped. */
export function normaliseMinistryNote(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  const note = typeof value === "string" ? value.trim() : "";
  if (note.length > MINISTRY_NOTE_MAX) {
    return {
      ok: false,
      error: `Keep the note under ${MINISTRY_NOTE_MAX} characters.`,
    };
  }
  return { ok: true, value: note || null };
}

/** Today first, then the earlier days that can still be reported, as Lagos date keys. */
export function reportableDateKeys(todayKey: string): string[] {
  return Array.from({ length: MINISTRY_LATE_DAYS + 1 }, (_, index) =>
    shiftDate(todayKey, -index),
  );
}

export function canReportFor(dateKey: string, todayKey: string): boolean {
  return reportableDateKeys(todayKey).includes(dateKey);
}

export function sumMinistryNumbers(rows: MinistryNumbers[]): MinistryNumbers {
  const total = emptyMinistryNumbers();
  for (const row of rows) {
    for (const field of MINISTRY_FIELDS) total[field.key] += row[field.key];
  }
  return total;
}

/** Everyone ministered to: reached online, reached offline, or present at a meeting. */
export function totalReached(numbers: MinistryNumbers): number {
  return numbers.reachedOnline + numbers.reachedOffline + numbers.attendance;
}

// ─── Date ranges for staff views ───────────────────────────────────────────

/** The longest span a staff range view will load. */
export const MINISTRY_RANGE_MAX_DAYS = 366;
export const MINISTRY_RANGE_DEFAULT_DAYS = 30;

/** True for a real calendar date written as YYYY-MM-DD (so not 2026-02-31 or 2026-13-01). */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const time = Date.parse(`${value}T00:00:00.000Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
}

/** Inclusive number of days between two date keys. */
export function daysInRange(fromKey: string, toKey: string): number {
  const from = Date.parse(`${fromKey}T00:00:00.000Z`);
  const to = Date.parse(`${toKey}T00:00:00.000Z`);
  return Math.round((to - from) / 86_400_000) + 1;
}

/**
 * Reads an untrusted from/to pair. The range never runs past today, is never
 * back to front, and is capped at `MINISTRY_RANGE_MAX_DAYS`; with nothing
 * given it is the last 30 days.
 */
export function resolveMinistryRange(
  input: { from?: string | null; to?: string | null },
  todayKey: string,
): { from: string; to: string } {
  const to = isDateKey(input.to) && input.to <= todayKey ? input.to : todayKey;
  let from = isDateKey(input.from)
    ? input.from
    : shiftDate(to, -(MINISTRY_RANGE_DEFAULT_DAYS - 1));
  if (from > to) from = to;
  if (daysInRange(from, to) > MINISTRY_RANGE_MAX_DAYS) {
    from = shiftDate(to, -(MINISTRY_RANGE_MAX_DAYS - 1));
  }
  return { from, to };
}

/** Ready-made ranges ending today. */
export function ministryRangePresets(
  todayKey: string,
): Array<{ label: string; from: string; to: string }> {
  return [
    { label: "Last 7 days", from: shiftDate(todayKey, -6), to: todayKey },
    { label: "Last 30 days", from: shiftDate(todayKey, -29), to: todayKey },
    { label: "Last 90 days", from: shiftDate(todayKey, -89), to: todayKey },
    { label: "This month", from: `${todayKey.slice(0, 8)}01`, to: todayKey },
    { label: "This year", from: `${todayKey.slice(0, 4)}-01-01`, to: todayKey },
  ];
}

// ─── Pleros activity compiled for the same day ─────────────────────────────

export type PrayerWatchSession = "unspecified" | "morning" | "afternoon" | "evening";

/** What the app already recorded for a member on one day. Never stored with the report. */
export type DayActivity = {
  bible: { chapters: number; book: string; chapter: number } | null;
  prayerWatch: PrayerWatchSession[];
  podcastEpisodes: number;
  /** null when the member is not in a cohort. */
  sogp: {
    /** null when no teaching was released that day. */
    listened: boolean | null;
    quizAttempted: boolean;
    writtenSubmitted: boolean;
    reviewAttended: boolean;
    preparationDone: boolean;
  } | null;
};

export const NO_DAY_ACTIVITY: DayActivity = {
  bible: null,
  prayerWatch: [],
  podcastEpisodes: 0,
  sogp: null,
};

const SESSION_ORDER: PrayerWatchSession[] = ["morning", "afternoon", "evening"];

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** The SOGP steps done that day, in programme order. */
export function sogpSteps(sogp: NonNullable<DayActivity["sogp"]>): string[] {
  return [
    sogp.preparationDone ? "Pre-SOGP day" : null,
    sogp.listened ? "teaching" : null,
    sogp.quizAttempted ? "quiz" : null,
    sogp.writtenSubmitted ? "written response" : null,
    sogp.reviewAttended ? "review session" : null,
  ].filter((step): step is string => step !== null);
}

export type ActivityLine = {
  key: "bible" | "prayerWatch" | "sogp" | "podcast";
  label: string;
  /** What was done, or null when nothing was recorded. */
  detail: string | null;
};

/** One line per activity area. `sogp` is left out for members not in a cohort. */
export function activityLines(activity: DayActivity): ActivityLine[] {
  const named = SESSION_ORDER.filter((session) =>
    activity.prayerWatch.includes(session),
  );
  const prayerDetail =
    named.length > 0
      ? named.join(", ")
      : activity.prayerWatch.length > 0
        ? "attended"
        : null;

  const lines: ActivityLine[] = [
    {
      key: "bible",
      label: "Bible reading",
      detail: activity.bible
        ? `${plural(activity.bible.chapters, "chapter")}, now at ${activity.bible.book} ${activity.bible.chapter}`
        : null,
    },
    { key: "prayerWatch", label: "Prayer Watch", detail: prayerDetail },
  ];
  if (activity.sogp) {
    const steps = sogpSteps(activity.sogp);
    lines.push({
      key: "sogp",
      label: "SOGP",
      detail: steps.length > 0 ? steps.join(", ") : null,
    });
  }
  lines.push({
    key: "podcast",
    label: "Podcast",
    detail:
      activity.podcastEpisodes > 0
        ? plural(activity.podcastEpisodes, "episode")
        : null,
  });
  return lines;
}

/** How many activity areas have something recorded — a quick "did anything happen" figure. */
export function activityCount(activity: DayActivity): number {
  return activityLines(activity).filter((line) => line.detail !== null).length;
}
