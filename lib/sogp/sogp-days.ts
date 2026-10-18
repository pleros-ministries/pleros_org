/**
 * The learner's SOGP as numbered days (user decision, 18 October): every
 * teaching day and every review day in the cohort's calendar, in order. The
 * traditional path is 24 teaching days plus the weekly review days, 28 in all.
 * Pure, so the Learning tab and the days page share it.
 */

export type SogpDayInput = {
  dateKey: string;
  kind: "weekday" | "weekend" | "review";
  prayerWatchComplete: boolean;
  track: null | { dayNumber: number; title: string; accessible: boolean; quizPassed: boolean; assessmentComplete: boolean };
  review: null | { title: string; complete: boolean };
};

export type SogpDay = {
  /** 1-based across all days; teaching days and reviews share the count. */
  number: number;
  dateKey: string;
  kind: "teaching" | "review";
  /** "Day 9" for teaching days, "R2" for the second review. */
  label: string;
  title: string;
  href: string | null;
  prayer: boolean;
  teaching: boolean;
  assessment: boolean;
  /** Every part of the day is done. */
  complete: boolean;
  open: boolean;
  isToday: boolean;
  past: boolean;
};

export type SogpDaysPlan = {
  days: SogpDay[];
  teachingDays: number;
  reviewDays: number;
  /** Today's day, or the last day before today; null before day 1. */
  current: SogpDay | null;
  startKey: string | null;
  endKey: string | null;
};

export function buildSogpDays(rows: SogpDayInput[], todayKey: string): SogpDaysPlan {
  let reviews = 0;
  const days: SogpDay[] = [];
  for (const row of [...rows].sort((a, b) => a.dateKey.localeCompare(b.dateKey))) {
    const isToday = row.dateKey === todayKey;
    const past = row.dateKey < todayKey;
    if (row.track) {
      const track = row.track;
      days.push({
        number: days.length + 1, dateKey: row.dateKey, kind: "teaching", label: `Day ${days.length + 1}`, title: track.title,
        href: track.accessible ? `/dashboard/sogp/course/day/${track.dayNumber}` : null,
        prayer: row.prayerWatchComplete, teaching: track.quizPassed || track.assessmentComplete, assessment: track.assessmentComplete,
        complete: row.prayerWatchComplete && track.assessmentComplete, open: track.accessible, isToday, past,
      });
    } else if (row.review || row.kind === "review") {
      reviews += 1;
      const done = row.review?.complete ?? false;
      days.push({
        number: days.length + 1, dateKey: row.dateKey, kind: "review", label: `R${reviews}`, title: row.review?.title ?? "Weekly review",
        href: "/dashboard/sogp/reviews", prayer: row.prayerWatchComplete, teaching: done, assessment: done,
        complete: done, open: row.dateKey <= todayKey, isToday, past,
      });
    }
  }
  const current = [...days].reverse().find(day => day.dateKey <= todayKey) ?? null;
  return {
    days,
    teachingDays: days.filter(day => day.kind === "teaching").length,
    reviewDays: reviews,
    current,
    startKey: days[0]?.dateKey ?? null,
    endKey: days.at(-1)?.dateKey ?? null,
  };
}

/** Days grouped into calendar weeks (Monday first), for the days page. */
export function sogpDayWeeks(days: SogpDay[]): SogpDay[][] {
  const weeks = new Map<string, SogpDay[]>();
  for (const day of days) {
    const date = new Date(`${day.dateKey}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    const key = date.toISOString().slice(0, 10);
    weeks.set(key, [...(weeks.get(key) ?? []), day]);
  }
  return [...weeks.values()];
}
