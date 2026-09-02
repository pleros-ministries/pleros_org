import { toLagosDateKey } from "./formation-progress";

/**
 * Length of the Pre-SOGP preparation window, in days. Drives the number of
 * dated preparation lessons, the calendar length, the seed size, and the
 * cohort launch-readiness check.
 */
export const PRE_SOGP_PREPARATION_DAYS = 14;

export type SogpCalendarState =
  | "future"
  | "current"
  | "missed"
  | "complete";

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day));
}

function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function getSogpLearningWeek<T extends { dateKey: string }>(
  days: T[],
  selectedDateKey: string,
): Array<T | null> {
  const selected = parseDateKey(selectedDateKey);
  const daysSinceMonday = (selected.getUTCDay() + 6) % 7;
  const monday = addDays(selectedDateKey, -daysSinceMonday);
  const daysByDate = new Map(days.map((day) => [day.dateKey, day]));

  return Array.from({ length: 7 }, (_, index) =>
    daysByDate.get(addDays(monday, index)) ?? null,
  );
}

export function buildPreparationDateKeys(preparationStartsAt: Date): string[] {
  const startDateKey = toLagosDateKey(preparationStartsAt);
  return Array.from({ length: PRE_SOGP_PREPARATION_DAYS }, (_, index) =>
    addDays(startDateKey, index),
  );
}

export function resolvePreparationStartsAt(
  cohortStartsAt: Date,
  preparationStartsAt: Date | null,
) {
  if (preparationStartsAt) return preparationStartsAt;
  const fallback = new Date(cohortStartsAt);
  fallback.setUTCDate(fallback.getUTCDate() - PRE_SOGP_PREPARATION_DAYS);
  return fallback;
}

export function buildCoreWeekdayDateKeys(
  startsAt: Date,
  count = 20,
): string[] {
  const dates: string[] = [];
  let cursor = addDays(toLagosDateKey(startsAt), -1);

  while (dates.length < count) {
    cursor = addDays(cursor, 1);
    const weekday = parseDateKey(cursor).getUTCDay();
    if (weekday !== 0 && weekday !== 6) dates.push(cursor);
  }

  return dates;
}

export function buildSogpDateKeys(startsAt: Date, endsAt: Date): string[] {
  const startDateKey = toLagosDateKey(startsAt);
  const endDateKey = toLagosDateKey(endsAt);
  const dates: string[] = [];
  let cursor = startDateKey;

  while (cursor <= endDateKey) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return dates;
}

export function deriveSogpCalendarState({
  dateKey,
  todayKey,
  requirements,
}: {
  dateKey: string;
  todayKey: string;
  requirements: boolean[];
}): SogpCalendarState {
  if (dateKey > todayKey) return "future";
  if (requirements.length > 0 && requirements.every(Boolean)) return "complete";
  return dateKey === todayKey ? "current" : "missed";
}

export function getSogpCountdown(startsAt: Date, now = new Date()) {
  const startDateKey = toLagosDateKey(startsAt);
  const todayKey = toLagosDateKey(now);
  const days = Math.max(
    0,
    Math.round(
      (parseDateKey(startDateKey).getTime() - parseDateKey(todayKey).getTime()) /
        86_400_000,
    ),
  );

  if (days === 0) {
    return { days, label: "SOGP is active", phase: "active" as const };
  }

  return {
    days,
    label: `${days} day${days === 1 ? "" : "s"} until SOGP begins`,
    phase: "upcoming" as const,
  };
}

export function getPreSogpCountdown(startsAt: Date, now = new Date()) {
  const startDateKey = toLagosDateKey(startsAt);
  const todayKey = toLagosDateKey(now);
  const days = Math.max(
    0,
    Math.round(
      (parseDateKey(startDateKey).getTime() - parseDateKey(todayKey).getTime()) /
        86_400_000,
    ),
  );

  if (days === 0) {
    return { days, label: "Pre-SOGP is active", phase: "active" as const };
  }

  return {
    days,
    label:
      days === 1
        ? "Pre-SOGP begins tomorrow"
        : `Pre-SOGP begins in ${days} days`,
    phase: "upcoming" as const,
  };
}
