import type { RangeParticipationRow } from "@/lib/sogp/daily-participation";

export type StudentStatus =
  | "unresponsive"
  | "at_risk"
  | "declining"
  | "generally_inconsistent"
  | "day_inconsistent"
  | "activity_inconsistent"
  | "on_track";

export const STUDENT_STATUS_META: Record<StudentStatus, { emoji: string; label: string }> = {
  unresponsive: { emoji: "⚪", label: "Unresponsive" },
  at_risk: { emoji: "🔴", label: "At Risk" },
  declining: { emoji: "🟠", label: "Declining" },
  generally_inconsistent: { emoji: "🟠", label: "Generally Inconsistent" },
  day_inconsistent: { emoji: "🟡", label: "Day Inconsistent" },
  activity_inconsistent: { emoji: "🟡", label: "Activity Inconsistent" },
  on_track: { emoji: "🟢", label: "On Track" },
};

export type StudentDayRecord = {
  dateKey: string;
  activities: {
    listened: boolean | null;
    prayerWatch: boolean;
    reviewAttended: boolean | null;
  };
};

// Tunable thresholds — named so behaviour can be adjusted without touching
// the classification logic itself.
export const WINDOW_DAYS = 7;
const AT_RISK_MIN_STREAK = 3;
const UNRESPONSIVE_MIN_STREAK = 7;
/** How far back callers should fetch participation data — enough to resolve
 * an in-progress streak that started just before the pattern window. */
export const LOOKBACK_DAYS = WINDOW_DAYS + UNRESPONSIVE_MIN_STREAK;
const DAY_SKIP_RATE_THRESHOLD = 0.3;
const ACTIVITY_MISS_RATE_THRESHOLD = 0.5;
const DECLINING_DROP_THRESHOLD = 0.25;
const DECLINING_MIN_EARLY_RATE = 0.6;
const MIN_APPLICABLE_DAYS_FOR_PATTERN = 3;

type ActivityKey = keyof StudentDayRecord["activities"];
const ACTIVITY_KEYS: ActivityKey[] = ["listened", "prayerWatch", "reviewAttended"];

function applicableCount(day: StudentDayRecord): number {
  return ACTIVITY_KEYS.reduce((count, key) => {
    const value = day.activities[key];
    return value === null ? count : count + 1;
  }, 0);
}

function completedCount(day: StudentDayRecord): number {
  return ACTIVITY_KEYS.reduce((count, key) => {
    return day.activities[key] === true ? count + 1 : count;
  }, 0);
}

function isZeroParticipationDay(day: StudentDayRecord): boolean {
  return applicableCount(day) > 0 && completedCount(day) === 0;
}

/** Pivots one enrollee's day rows out of a flat range-query result, sorted oldest→newest. */
export function buildStudentDayRecords(
  rows: RangeParticipationRow[],
  enrollmentId: number,
): StudentDayRecord[] {
  return rows
    .filter((row) => row.enrollmentId === enrollmentId)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .map((row) => ({
      dateKey: row.dateKey,
      activities: {
        listened: row.listened,
        prayerWatch: row.prayerWatch,
        reviewAttended: row.reviewApplicable ? row.reviewAttended : null,
      },
    }));
}

/** The later of `enrollmentCreatedAt` and `cohortStartsAt`, as a date key — the
 * earliest day that can legitimately count toward this student's pattern. */
export function clipWindowStart(
  enrollmentCreatedAt: Date,
  cohortStartsAt: Date,
  earliestAvailable: string,
): string {
  const clipDate = enrollmentCreatedAt > cohortStartsAt ? enrollmentCreatedAt : cohortStartsAt;
  const clipKey = clipDate.toISOString().slice(0, 10);
  return clipKey > earliestAvailable ? clipKey : earliestAvailable;
}

/**
 * Classifies a student's status from their recent day-by-day participation.
 * `days` should be sorted oldest→newest and cover enough lookback to resolve
 * an in-progress streak (at least `UNRESPONSIVE_MIN_STREAK` days beyond the
 * pattern window) — callers fetch this via `getSogpParticipationRange` and
 * `buildStudentDayRecords`. Days before the student's enrollment/cohort start
 * should already be excluded by the caller.
 */
export function classifyStudentStatus(days: StudentDayRecord[]): StudentStatus {
  const withSignal = days.filter((day) => applicableCount(day) > 0);
  if (withSignal.length === 0) return "on_track";

  // 1. Consecutive zero-participation streak, walked back from the most
  // recent day with any applicable activity.
  let streak = 0;
  for (let i = withSignal.length - 1; i >= 0; i -= 1) {
    if (!isZeroParticipationDay(withSignal[i]!)) break;
    streak += 1;
  }
  if (streak >= UNRESPONSIVE_MIN_STREAK) return "unresponsive";
  if (streak >= AT_RISK_MIN_STREAK) return "at_risk";

  // 2. Pattern checks look only at the most recent WINDOW_DAYS calendar days
  // (a shorter clipped history — e.g. a brand-new enrollment — naturally
  // yields fewer days here, handled by the MIN_APPLICABLE_DAYS_FOR_PATTERN
  // check below), not the longer lookback used for streak detection above.
  const patternDays = days.slice(-WINDOW_DAYS).filter((day) => applicableCount(day) > 0);
  if (patternDays.length < MIN_APPLICABLE_DAYS_FOR_PATTERN) return "on_track";

  // 3. Declining: completion rate in the earlier half vs. the later half.
  const midpoint = Math.floor(patternDays.length / 2);
  const earlyDays = patternDays.slice(0, midpoint);
  const lateDays = patternDays.slice(patternDays.length - midpoint);
  const completionRate = (bucket: StudentDayRecord[]) => {
    const applicable = bucket.reduce((sum, day) => sum + applicableCount(day), 0);
    if (applicable === 0) return null;
    const completed = bucket.reduce((sum, day) => sum + completedCount(day), 0);
    return completed / applicable;
  };
  const earlyRate = completionRate(earlyDays);
  const lateRate = completionRate(lateDays);
  if (
    earlyRate !== null &&
    lateRate !== null &&
    earlyRate >= DECLINING_MIN_EARLY_RATE &&
    earlyRate - lateRate >= DECLINING_DROP_THRESHOLD
  ) {
    return "declining";
  }

  // 4. Day- vs. activity-level inconsistency over the pattern window.
  const zeroDays = patternDays.filter(isZeroParticipationDay).length;
  const dayInconsistencyRate = zeroDays / patternDays.length;

  let worstActivityMissRate = 0;
  for (const key of ACTIVITY_KEYS) {
    const applicableDays = patternDays.filter((day) => day.activities[key] !== null);
    if (applicableDays.length === 0) continue;
    const missed = applicableDays.filter((day) => day.activities[key] === false).length;
    worstActivityMissRate = Math.max(worstActivityMissRate, missed / applicableDays.length);
  }

  const dayInconsistent = dayInconsistencyRate >= DAY_SKIP_RATE_THRESHOLD;
  const activityInconsistent = worstActivityMissRate >= ACTIVITY_MISS_RATE_THRESHOLD;

  if (dayInconsistent && activityInconsistent) return "generally_inconsistent";
  if (dayInconsistent) return "day_inconsistent";
  if (activityInconsistent) return "activity_inconsistent";

  return "on_track";
}
