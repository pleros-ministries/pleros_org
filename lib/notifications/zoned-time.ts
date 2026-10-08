import { shiftDate } from "../sogp/daily-date";

/**
 * Time-zone maths for reminders. Africa/Lagos is the programme's clock (dates,
 * Prayer Watch, teaching releases); a learner's own IANA zone is only used to
 * turn "6:30 am where I am" into an instant.
 *
 * Everything here is pure `Intl`, so client components may import it.
 */

export const LAGOS_TIME_ZONE = "Africa/Lagos";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      // `hour12: false` makes some engines print midnight as "24".
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export type ZonedParts = {
  /** Calendar date in the zone, `YYYY-MM-DD`. */
  dateKey: string;
  /** Minutes after midnight in the zone, 0–1439. */
  minutes: number;
  /** 0 = Sunday … 6 = Saturday, for `dateKey`. */
  weekday: number;
};

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const dateKey = `${value("year")}-${value("month")}-${value("day")}`;
  const hour = Number(value("hour")) % 24;
  const minute = Number(value("minute"));

  return {
    dateKey,
    minutes: hour * 60 + minute,
    weekday: weekdayOf(dateKey),
  };
}

export function getZonedMinutesSinceMidnight(date: Date, timeZone: string) {
  return getZonedParts(date, timeZone).minutes;
}

/** A date key read as that day's midnight UTC, in milliseconds. */
function dateKeyToUtcMs(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year!, month! - 1, day!);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(dateKey: string) {
  return new Date(dateKeyToUtcMs(dateKey)).getUTCDay();
}

export function shiftDateKey(dateKey: string, days: number) {
  return shiftDate(dateKey, days);
}

/** The Monday on or before `dateKey`. */
export function mondayOf(dateKey: string) {
  return shiftDate(dateKey, -((weekdayOf(dateKey) + 6) % 7));
}

/** Whole days from `fromDateKey` to `toDateKey` (negative when earlier). */
export function daysBetween(fromDateKey: string, toDateKey: string) {
  return Math.round(
    (dateKeyToUtcMs(toDateKey) - dateKeyToUtcMs(fromDateKey)) / DAY_MS,
  );
}

/** How far the zone's wall clock is ahead of UTC at `instantMs`. */
function zoneOffsetMs(instantMs: number, timeZone: string) {
  const wholeMinute = instantMs - (((instantMs % MINUTE_MS) + MINUTE_MS) % MINUTE_MS);
  const parts = getZonedParts(new Date(wholeMinute), timeZone);
  const wallAsUtc = dateKeyToUtcMs(parts.dateKey) + parts.minutes * MINUTE_MS;
  return wallAsUtc - wholeMinute;
}

/**
 * The instant at which a zone's wall clock reads `minutes` after midnight on
 * `dateKey`.
 *
 * Two passes of offset correction keep the result exact across DST changes and
 * make the odd cases deterministic: a time that occurs twice (clocks going
 * back) resolves to its first occurrence, and a time skipped when clocks go
 * forward resolves to an instant shortly before the change, where the clock
 * reads one hour earlier.
 */
export function zonedTimeToUtc(
  dateKey: string,
  minutes: number,
  timeZone: string,
): Date {
  const wallAsUtc = dateKeyToUtcMs(dateKey) + minutes * MINUTE_MS;
  const firstGuess = wallAsUtc - zoneOffsetMs(wallAsUtc, timeZone);
  return new Date(wallAsUtc - zoneOffsetMs(firstGuess, timeZone));
}

/**
 * True from `dueAt` (inclusive) until `windowMs` later (exclusive). Reminders
 * are matched against a window, never an exact minute, so a late cron run
 * still delivers.
 */
export function isDue(dueAt: Date, now: Date, windowMs: number) {
  const elapsed = now.getTime() - dueAt.getTime();
  return elapsed >= 0 && elapsed < windowMs;
}

/** `390` → `6:30 am`, matching how Prayer Watch times are written. */
export function formatClock(minutes: number) {
  const normalised = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hour = Math.floor(normalised / 60);
  const minute = normalised % 60;
  const suffix = hour < 12 ? "am" : "pm";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/**
 * A wall-clock time in one zone, read in another. `dayShift` is how many
 * calendar days the reading moves (for example 8:30 pm Lagos is the next
 * morning in Auckland, `dayShift: 1`).
 */
export function convertClock(
  minutes: number,
  fromTimeZone: string,
  toTimeZone: string,
  dateKey: string,
): { minutes: number; dayShift: number } {
  const instant = zonedTimeToUtc(dateKey, minutes, fromTimeZone);
  const target = getZonedParts(instant, toTimeZone);
  return {
    minutes: target.minutes,
    dayShift: daysBetween(dateKey, target.dateKey),
  };
}
