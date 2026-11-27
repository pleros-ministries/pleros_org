/**
 * One shared month for everyone (Pastor, 25 November 2026): calendars show the
 * Lagos calendar month, not a window of your own. Your place in your path
 * stays yours: the month lays out what's next from wherever you are, and what
 * doesn't fit carries into the next month. Pure rules only.
 */
import { mondayOf, shiftDateKey } from "@/lib/notifications/zoned-time";

/** One thing learnt, or planned, on a day. */
export type MonthItem = { title: string; meta: string; href?: string | null };

export type CalendarDay = {
  dateKey: string;
  /** What you learnt that day (`done`), or what's planned for it. */
  learning: (MonthItem & { done: boolean }) | null;
  /** Prayer Watch sessions recorded that day. */
  prayer: number;
  bible: boolean;
};

/** What you did each day of the month so far, keyed by Lagos date. */
export type MonthActivity = {
  learnt: Record<string, MonthItem[]>;
  prayer: Record<string, number>;
  bible: readonly string[];
};

const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

function lastDayKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year!, month!, 0)).getUTCDate();
  return `${monthKey}-${String(lastDay).padStart(2, "0")}`;
}

/** The month's dates as Monday-first weeks; days outside the month are null. */
export function monthWeeks(monthKey: string): Array<Array<string | null>> {
  const lastKey = lastDayKey(monthKey);
  const weeks: Array<Array<string | null>> = [];
  for (let start = mondayOf(`${monthKey}-01`); start <= lastKey; start = shiftDateKey(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => {
      const key = shiftDateKey(start, index);
      return key.startsWith(monthKey) ? key : null;
    }));
  }
  return weeks;
}

export type PlannedDay<T> = { dateKey: string; items: T[] };

/**
 * Lays your unfinished items out `perDay` a day from `fromKey` to `endKey`.
 * Whatever doesn't fit carries into next month, so nothing is lost when the
 * month turns.
 */
export function planMonth<T>(items: readonly T[], { fromKey, endKey, perDay }: { fromKey: string; endKey: string; perDay: number }): { days: Array<PlannedDay<T>>; carried: T[] } {
  const pace = Math.max(1, Math.floor(perDay));
  const days: Array<PlannedDay<T>> = [];
  let offset = 0;
  for (let key = fromKey; key <= endKey && offset < items.length; key = shiftDateKey(key, 1)) {
    days.push({ dateKey: key, items: items.slice(offset, offset + pace) });
    offset += pace;
  }
  return { days, carried: items.slice(offset) };
}

/** Several things learnt in one day read as the first, "and 2 more". */
function summarise(items: readonly MonthItem[]): MonthItem {
  const [first] = items;
  return items.length > 1 ? { ...first!, meta: `${first!.meta} · and ${items.length - 1} more` } : first!;
}

export type MonthPlan = {
  /** Every day of the month that holds something, keyed by date. */
  days: Record<string, CalendarDay>;
  /** Today (or tomorrow, once today's learning is done) to the month's end. */
  rest: Array<{ dateKey: string; item: MonthItem }>;
  /** How many planned days carry into next month. */
  carried: number;
  /** The day your plan would end, a day at a time from now; null without a plan. */
  finishKey: string | null;
  counts: { learnt: number; prayer: number; bible: number };
};

/**
 * The month as one person sees it: past days hold what they did; today and
 * the days after hold their plan, one planned day per calendar day. Today's
 * plan moves to tomorrow once something has been learnt today.
 */
export function buildMonthPlan({ monthKey, todayKey, activity, plan }: {
  monthKey: string;
  todayKey: string;
  activity: MonthActivity;
  /** The unfinished days of your path, in order, one calendar day each. */
  plan: readonly MonthItem[];
}): MonthPlan {
  const endKey = lastDayKey(monthKey);
  const days: Record<string, CalendarDay> = {};
  const bible = new Set(activity.bible);
  const day = (dateKey: string): CalendarDay => (days[dateKey] ??= { dateKey, learning: null, prayer: 0, bible: false });

  for (const [dateKey, items] of Object.entries(activity.learnt)) {
    if (!dateKey.startsWith(monthKey) || dateKey > todayKey || !items.length) continue;
    day(dateKey).learning = { ...summarise(items), done: true };
  }
  for (const [dateKey, count] of Object.entries(activity.prayer)) {
    if (dateKey.startsWith(monthKey) && dateKey <= todayKey && count > 0) day(dateKey).prayer = count;
  }
  for (const dateKey of bible) {
    if (dateKey.startsWith(monthKey) && dateKey <= todayKey) day(dateKey).bible = true;
  }

  const fromKey = days[todayKey]?.learning?.done ? shiftDateKey(todayKey, 1) : todayKey;
  const laid = planMonth(plan, { fromKey, endKey, perDay: 1 });
  for (const entry of laid.days) day(entry.dateKey).learning = { ...entry.items[0]!, done: false };

  const keys = Object.keys(days).filter(key => key <= todayKey);
  return {
    days,
    rest: laid.days.map(entry => ({ dateKey: entry.dateKey, item: entry.items[0]! })),
    carried: laid.carried.length,
    finishKey: plan.length ? shiftDateKey(fromKey, plan.length - 1) : null,
    counts: {
      learnt: keys.filter(key => days[key]!.learning?.done).length,
      prayer: keys.reduce((sum, key) => sum + days[key]!.prayer, 0),
      bible: keys.filter(key => days[key]!.bible).length,
    },
  };
}

/**
 * How `total` planned days starting `fromKey` fall across calendar months:
 * "6 in what’s left of November and 24 in December". Counts are in `unit`s,
 * `perDay` to a day.
 */
export function describeMonthSplit(fromKey: string, totalDays: number, perDay = 1) {
  const parts: Array<{ name: string; days: number }> = [];
  for (let offset = 0; offset < totalDays; offset += 1) {
    const name = monthName.format(new Date(`${shiftDateKey(fromKey, offset)}T00:00:00.000Z`));
    if (parts.at(-1)?.name === name) parts.at(-1)!.days += 1;
    else parts.push({ name, days: 1 });
  }
  const phrases = parts.map((part, index) => `${part.days * perDay} in ${index === 0 && !fromKey.endsWith("-01") ? `what’s left of ${part.name}` : part.name}`);
  return phrases.length > 1 ? `${phrases.slice(0, -1).join(", ")} and ${phrases.at(-1)}` : phrases[0] ?? "";
}
