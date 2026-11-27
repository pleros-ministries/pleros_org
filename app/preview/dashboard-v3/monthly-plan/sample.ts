import type { MonthCalendarData } from "@/lib/dashboard/month-data";
import { monthWindow } from "@/lib/leaderboard/monthly";
import { buildMonthPlan, type MonthActivity, type MonthItem } from "@/lib/learning/month-calendar";

/**
 * Sample data only: one Podcast learner on the 30-episode plan, one a day,
 * from 3 November. Generic series titles from the Foundations plan; no people.
 */
const SERIES: Array<[string, number]> = [
  ["The Place of the Gospel in Your Life", 4],
  ["The Reality of God’s Purpose", 12],
  ["The Pursuit of God’s Purpose", 12],
  ["How to Fulfil God’s Purpose", 2],
];
const PLAN: MonthItem[] = SERIES.flatMap(([title, parts]) => Array.from({ length: parts }, (_, index) => ({ title, meta: `Part ${index + 1}`, href: "#" })));

const SKIPPED = new Set([7, 12, 15, 21]);
const PRAYER: Record<number, number> = { 3: 1, 4: 1, 5: 1, 6: 1, 8: 1, 9: 2, 10: 2, 11: 1, 13: 1, 14: 1, 16: 2, 17: 1, 18: 1, 19: 1, 20: 1, 22: 1, 23: 2, 24: 1, 25: 1 };
const BIBLE = [2, 4, 6, 9, 11, 13, 17, 19, 22, 24];
const key = (month: string, day: number) => `${month}-${String(day).padStart(2, "0")}`;

function sample(todayKey: string, activity: MonthActivity, listened: number): MonthCalendarData {
  const month = monthWindow(todayKey);
  const built = buildMonthPlan({ monthKey: month.key, todayKey, activity, plan: PLAN.slice(listened) });
  return { ...built, month, todayKey, path: "podcast_one", podcast: true, morningPrayedToday: false, perDay: 1, itemsLeft: PLAN.length - listened };
}

/** November, seen on the 25th: 18 days learnt so far. */
export function novemberSample() {
  const learnt: MonthActivity["learnt"] = {};
  let next = 0;
  for (let day = 3; day < 25; day += 1) if (!SKIPPED.has(day)) learnt[key("2026-11", day)] = [{ ...PLAN[next++]!, href: null }];
  return sample("2026-11-25", { learnt, prayer: Object.fromEntries(Object.entries(PRAYER).map(([day, count]) => [key("2026-11", Number(day)), count])), bible: BIBLE.map(day => key("2026-11", day)) }, next);
}

/** December, seen on the 1st: five more episodes were listened to in November. */
export function decemberSample() {
  return sample("2026-12-01", { learnt: {}, prayer: {}, bible: [] }, 23);
}
