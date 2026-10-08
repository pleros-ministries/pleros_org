import type {
  PreSogpJourneyData,
  SogpJourneyData,
} from "../db/queries/sogp-journey";
import {
  PRAYER_WATCH_TIME_ZONE,
  type PrayerWatchSession,
  type PrayerWatchSessionId,
} from "../prayer-watch";
import { sogpReleaseInstant } from "../sogp/schedule";

import type { ReminderPreferences } from "./reminder-preferences";
import {
  getZonedParts,
  mondayOf,
  shiftDateKey,
  weekdayOf,
  zonedTimeToUtc,
} from "./zoned-time";

/**
 * Every rule the reminder dispatcher applies, as pure functions.
 *
 * Reminders are never matched against an exact minute. Each one has a due
 * instant and a window; the dispatcher claims a checkpoint key before sending,
 * so a late or repeated cron run delivers exactly once.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Prayer Watch reminders go out this long before a session starts. */
export const PRAYER_WATCH_LEAD_MINUTES = 10;
/** …and stop at the session start: "begins soon" is never sent late. */
export const PRAYER_WATCH_WINDOW_MS = PRAYER_WATCH_LEAD_MINUTES * MINUTE_MS;

export const TEACHING_WINDOW_MS = 30 * MINUTE_MS;

/** Evening nudge: 7:00 pm in the learner's zone. */
export const NUDGE_MINUTES = 19 * 60;
export const NUDGE_WINDOW_MS = 30 * MINUTE_MS;
/** A teaching reminder this late already covers the evening. */
export const NUDGE_SKIP_FROM_MINUTES = 17 * 60;

/** Weekly summary: Monday 8:00 am in the learner's zone. */
export const WEEKLY_MINUTES = 8 * 60;
export const WEEKLY_WINDOW_MS = 60 * MINUTE_MS;
/** …but never before Sunday 9:00 pm Lagos, once the Sunday review has ended. */
const WEEKLY_EARLIEST_LAGOS_MINUTES = 21 * 60;
/**
 * A cohort ends on the Sunday of its last week, and that week's summary is due
 * the next morning, so summaries keep going for a short while after the end.
 */
export const WEEKLY_GRACE_MS = 36 * HOUR_MS;

/** Only announce something published recently, never an old item resurfacing. */
export const NEW_CONTENT_MAX_AGE_MS = 48 * HOUR_MS;

/** Dated checkpoint keys are safe to delete once this old. */
export const CHECKPOINT_RETENTION_DAYS = 14;
export const PRUNABLE_CHECKPOINT_PREFIXES = [
  "pw:",
  "teach:",
  "nudge:",
  "weekly:",
  "content:",
] as const;

// ─── Cohort and phase ───────────────────────────────────────────────────────

export type ReminderCohort = {
  id: number;
  startsAt: Date;
  endsAt: Date;
  /** Lagos calendar date of `startsAt`. */
  startDateKey: string;
};

export type ReminderPhase = "preparing" | "active";

/**
 * The learner's own "today" and "yesterday". Evaluating both means a window
 * that straddles local midnight (an 11:50 pm reminder caught at 12:05 am) is
 * not lost; the dated checkpoint key keeps it to one send.
 */
export function localSlots(now: Date, timeZone: string): string[] {
  const today = getZonedParts(now, timeZone).dateKey;
  return [today, shiftDateKey(today, -1)];
}

/**
 * Phase follows the slot's date, not the clock: a west-of-Lagos learner's last
 * preparation evening falls after the cohort has started in Lagos, and they
 * should still be reminded about that preparation day.
 */
export function slotPhase(
  dateKey: string,
  cohort: Pick<ReminderCohort, "startDateKey">,
): ReminderPhase {
  return dateKey < cohort.startDateKey ? "preparing" : "active";
}

export function isCohortRunning(
  cohort: Pick<ReminderCohort, "endsAt">,
  now: Date,
) {
  return now.getTime() <= cohort.endsAt.getTime();
}

/**
 * The one cohort reminders are about, for a learner who may hold several
 * enrolments. Chosen by dates, because a cohort's `status` is not kept
 * current: a cohort that is running now (the most recently started), else the
 * next one to start, else one that ended within the weekly-summary grace.
 */
export function chooseReminderCohort<
  Cohort extends Pick<ReminderCohort, "startsAt" | "endsAt">,
>(cohorts: Cohort[], now: Date): Cohort | null {
  const time = now.getTime();
  const byStart = (a: Cohort, b: Cohort) =>
    a.startsAt.getTime() - b.startsAt.getTime();

  const running = cohorts
    .filter(
      (cohort) =>
        cohort.startsAt.getTime() <= time && time <= cohort.endsAt.getTime(),
    )
    .sort(byStart);
  if (running.length > 0) return running[running.length - 1]!;

  const upcoming = cohorts
    .filter((cohort) => cohort.startsAt.getTime() > time)
    .sort(byStart);
  if (upcoming.length > 0) return upcoming[0]!;

  const justEnded = cohorts
    .filter(
      (cohort) =>
        cohort.endsAt.getTime() < time &&
        time < cohort.endsAt.getTime() + WEEKLY_GRACE_MS,
    )
    .sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  return justEnded.length > 0 ? justEnded[justEnded.length - 1]! : null;
}

export function isWeeklySummaryEligible(
  cohort: Pick<ReminderCohort, "startsAt" | "endsAt">,
  now: Date,
) {
  return (
    now.getTime() >= cohort.startsAt.getTime() &&
    now.getTime() < cohort.endsAt.getTime() + WEEKLY_GRACE_MS
  );
}

// ─── Due instants ───────────────────────────────────────────────────────────

export function prayerWatchDue(
  session: Pick<PrayerWatchSession, "hour" | "minute">,
  lagosDateKey: string,
): Date {
  return zonedTimeToUtc(
    lagosDateKey,
    session.hour * 60 + session.minute - PRAYER_WATCH_LEAD_MINUTES,
    PRAYER_WATCH_TIME_ZONE,
  );
}

/**
 * When the teaching for `dateKey` can first be opened. Core teachings unlock a
 * week at a time, at the Monday release; preparation lessons open at Lagos
 * midnight of their own date.
 */
export function teachingReleaseInstant(
  dateKey: string,
  phase: ReminderPhase,
): Date {
  return phase === "active"
    ? sogpReleaseInstant(mondayOf(dateKey))
    : zonedTimeToUtc(dateKey, 0, PRAYER_WATCH_TIME_ZONE);
}

/**
 * The learner's chosen local time on `dateKey`, held back until the teaching
 * is open. In practice only a Monday is ever held (for early risers and for
 * learners east of Lagos).
 */
export function teachingDue(input: {
  dateKey: string;
  minutes: number;
  timeZone: string;
  phase: ReminderPhase;
}): Date {
  const chosen = zonedTimeToUtc(input.dateKey, input.minutes, input.timeZone);
  const release = teachingReleaseInstant(input.dateKey, input.phase);
  return chosen.getTime() >= release.getTime() ? chosen : release;
}

export function nudgeDue(dateKey: string, timeZone: string): Date {
  return zonedTimeToUtc(dateKey, NUDGE_MINUTES, timeZone);
}

export function isMonday(dateKey: string) {
  return weekdayOf(dateKey) === 1;
}

/** `mondayKey` must be a Monday in the learner's zone. */
export function weeklyDue(mondayKey: string, timeZone: string): Date {
  const local = zonedTimeToUtc(mondayKey, WEEKLY_MINUTES, timeZone);
  const earliest = zonedTimeToUtc(
    shiftDateKey(mondayKey, -1),
    WEEKLY_EARLIEST_LAGOS_MINUTES,
    PRAYER_WATCH_TIME_ZONE,
  );
  return local.getTime() >= earliest.getTime() ? local : earliest;
}

// ─── What to remind about ───────────────────────────────────────────────────

type ActiveDay = SogpJourneyData["days"][number];
type PreparationDay = PreSogpJourneyData["days"][number];

export type ReminderTarget = {
  /** `today` is the slot's own teaching; `catch_up` is an earlier one. */
  kind: "today" | "catch_up";
  dateKey: string;
  title: string;
};

function isOpenTeaching(day: ActiveDay) {
  return Boolean(
    day.track && day.track.accessible && !day.track.assessmentComplete,
  );
}

function isOpenLesson(day: PreparationDay) {
  return day.lesson !== null && !day.lessonComplete;
}

function earliestBefore<Day extends { dateKey: string }>(
  days: Day[],
  dateKey: string,
  isOpen: (day: Day) => boolean,
): Day | null {
  let earliest: Day | null = null;
  for (const day of days) {
    if (day.dateKey >= dateKey || !isOpen(day)) continue;
    if (!earliest || day.dateKey < earliest.dateKey) earliest = day;
  }
  return earliest;
}

/**
 * Today's teaching if it is unfinished; otherwise the earliest unfinished
 * earlier teaching; otherwise nothing. It never looks past the slot's date,
 * even though the rest of the week is already open.
 */
export function pickTeachingTarget(
  days: ActiveDay[],
  dateKey: string,
): ReminderTarget | null {
  const today = days.find((day) => day.dateKey === dateKey);
  if (today && isOpenTeaching(today)) {
    return { kind: "today", dateKey, title: today.track!.title };
  }
  const earlier = earliestBefore(days, dateKey, isOpenTeaching);
  return earlier
    ? { kind: "catch_up", dateKey: earlier.dateKey, title: earlier.track!.title }
    : null;
}

export function pickPreparationTarget(
  days: PreparationDay[],
  dateKey: string,
): ReminderTarget | null {
  const today = days.find((day) => day.dateKey === dateKey);
  if (today && isOpenLesson(today)) {
    return { kind: "today", dateKey, title: today.lesson!.title };
  }
  const earlier = earliestBefore(days, dateKey, isOpenLesson);
  return earlier
    ? { kind: "catch_up", dateKey: earlier.dateKey, title: earlier.lesson!.title }
    : null;
}

/** The nudge is only ever about the slot's own day. */
export function pickNudgeTarget(
  days: ActiveDay[],
  dateKey: string,
): ReminderTarget | null {
  const today = days.find((day) => day.dateKey === dateKey);
  return today && isOpenTeaching(today)
    ? { kind: "today", dateKey, title: today.track!.title }
    : null;
}

export function pickPreparationNudgeTarget(
  days: PreparationDay[],
  dateKey: string,
): ReminderTarget | null {
  const today = days.find((day) => day.dateKey === dateKey);
  return today && isOpenLesson(today)
    ? { kind: "today", dateKey, title: today.lesson!.title }
    : null;
}

/** Skip the nudge when a late teaching reminder already covers the evening. */
export function shouldSkipNudge(
  preferences: Pick<
    ReminderPreferences,
    "teachingReminderEnabled" | "teachingTimeMinutes"
  >,
) {
  return (
    preferences.teachingReminderEnabled &&
    preferences.teachingTimeMinutes !== null &&
    preferences.teachingTimeMinutes >= NUDGE_SKIP_FROM_MINUTES
  );
}

export function wantsPrayerWatchReminder(
  preferences: Pick<ReminderPreferences, "prayerWatch">,
  sessionId: PrayerWatchSessionId,
) {
  return preferences.prayerWatch[sessionId];
}

/**
 * The two journey loaders choose an enrolment differently, so a returning
 * learner can be handed an old cohort's journey. Reminders only ever use a
 * journey that belongs to the cohort the dispatcher selected.
 */
export function isActiveJourneyForCohort(
  journey: Pick<SogpJourneyData, "cohort">,
  cohort: Pick<ReminderCohort, "startsAt">,
) {
  return (
    new Date(journey.cohort.startsAt).getTime() === cohort.startsAt.getTime()
  );
}

export function isPreparationJourneyForCohort(
  journey: Pick<PreSogpJourneyData, "cohort">,
  cohort: Pick<ReminderCohort, "id">,
) {
  return journey.cohort.id === cohort.id;
}

// ─── Weekly summary ─────────────────────────────────────────────────────────

export type WeeklySummary = {
  teachingsCompleted: number;
  teachingsTotal: number;
  prayerWatchDays: number;
  prayerWatchTotal: number;
  reviewsCompleted: number;
  reviewsTotal: number;
};

/**
 * Counts for the seven calendar dates before `mondayKey`. Null when the
 * cohort has no days in that week (the first Monday, or a different cohort).
 */
export function buildWeeklySummary(
  days: ActiveDay[],
  mondayKey: string,
): WeeklySummary | null {
  const from = shiftDateKey(mondayKey, -7);
  const to = shiftDateKey(mondayKey, -1);
  const week = days.filter((day) => day.dateKey >= from && day.dateKey <= to);
  if (week.length === 0) return null;

  const teachings = week.filter((day) => day.track !== null);
  const reviews = week.filter((day) => day.review !== null);

  return {
    teachingsCompleted: teachings.filter(
      (day) => day.track!.assessmentComplete,
    ).length,
    teachingsTotal: teachings.length,
    prayerWatchDays: week.filter((day) => day.prayerWatchComplete).length,
    prayerWatchTotal: week.length,
    reviewsCompleted: reviews.filter((day) => day.review!.complete).length,
    reviewsTotal: reviews.length,
  };
}

// ─── New content ────────────────────────────────────────────────────────────

export type NewContentSource = "podcast" | "youtube";

export function isFreshContent(publishedAt: string, now: Date) {
  const published = Date.parse(publishedAt);
  if (Number.isNaN(published)) return false;
  const age = now.getTime() - published;
  return age >= -HOUR_MS && age <= NEW_CONTENT_MAX_AGE_MS;
}

// ─── Checkpoint keys ────────────────────────────────────────────────────────

/**
 * Every key that `pruneCheckpoints` may delete embeds a date, and the
 * dispatcher only evaluates today and yesterday, so deleting an old key can
 * never cause a second send. `content-last:` keys are not dated and are never
 * pruned.
 */
export const reminderKeys = {
  prayerWatch: (
    sessionId: PrayerWatchSessionId,
    lagosDateKey: string,
    userId: string,
  ) => `pw:${sessionId}:${lagosDateKey}:${userId}`,
  teaching: (userId: string, dateKey: string) => `teach:${userId}:${dateKey}`,
  nudge: (userId: string, dateKey: string) => `nudge:${userId}:${dateKey}`,
  weekly: (userId: string, mondayKey: string) => `weekly:${userId}:${mondayKey}`,
  /** One new-content alert per Lagos day, whichever source is seen first. */
  contentDay: (lagosDateKey: string) => `content:${lagosDateKey}`,
  contentLast: (source: NewContentSource) => `content-last:${source}`,
};

// ─── Push copy ──────────────────────────────────────────────────────────────
//
// Push text carries titles and counts only: never a message, check-in answer,
// prayer request, quiz answer or written response.

export type ReminderPush = { title: string; body: string; url: string };

function journeyUrl(phase: ReminderPhase, dateKey: string) {
  // Always pinned to a date: the dashboards default to Lagos "today", which is
  // a different day for learners far from Lagos.
  return phase === "preparing"
    ? `/dashboard/pre-sogp?date=${dateKey}`
    : `/dashboard/sogp?date=${dateKey}`;
}

export function buildPrayerWatchPush(
  session: Pick<PrayerWatchSession, "time">,
  lagosDateKey: string,
  phase: ReminderPhase | null,
): ReminderPush {
  return {
    title: "Prayer Watch begins soon",
    body: `Join the ${session.time} Prayer Watch on Pleros Live.`,
    url: phase ? journeyUrl(phase, lagosDateKey) : "/dashboard/prayer-watch",
  };
}

export function buildTeachingPush(
  target: ReminderTarget,
  phase: ReminderPhase,
): ReminderPush {
  const title =
    phase === "preparing"
      ? target.kind === "today"
        ? "Time for today's preparation"
        : "Continue your SOGP preparation"
      : target.kind === "today"
        ? "Time for today's teaching"
        : "Continue your SOGP teaching";

  return { title, body: target.title, url: journeyUrl(phase, target.dateKey) };
}

export function buildNudgePush(
  target: ReminderTarget,
  phase: ReminderPhase,
): ReminderPush {
  return {
    title:
      phase === "preparing"
        ? "Still time for today's preparation"
        : "Still time for today's teaching",
    body: `${target.title} is waiting for you.`,
    url: journeyUrl(phase, target.dateKey),
  };
}

export function buildWeeklySummaryPush(summary: WeeklySummary): ReminderPush {
  return {
    title: "Your week on Pleros",
    body:
      `Last week: ${summary.teachingsCompleted} of ${summary.teachingsTotal} teachings, ` +
      `Prayer Watch on ${summary.prayerWatchDays} of ${summary.prayerWatchTotal} days, ` +
      `${summary.reviewsCompleted} of ${summary.reviewsTotal} reviews.`,
    url: "/dashboard/sogp",
  };
}

export function buildNewContentPush(
  source: NewContentSource,
  title: string,
): ReminderPush {
  return source === "podcast"
    ? { title: "New podcast episode", body: title, url: "/dashboard/podcast" }
    : { title: "New from Pleros", body: title, url: "/" };
}
