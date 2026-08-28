import { toLagosDateKey } from "./formation-progress";

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

export function buildPreparationDateKeys(startsAt: Date): string[] {
  const startDateKey = toLagosDateKey(startsAt);
  return Array.from({ length: 30 }, (_, index) =>
    addDays(startDateKey, index - 30),
  );
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
