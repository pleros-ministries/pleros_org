import type { DayActivity } from "@/lib/community/ministry-report";
import { SOGP_LEVELS, SOGP_TRACKS, type SogpCurriculumTrack } from "@/lib/sogp/curriculum";
import { shiftDate } from "@/lib/sogp/daily-date";

import { devotionFor } from "./daily-report";
import { cohortStartFor } from "./fixtures";
import type { DemoState } from "./types";

/**
 * The demo cohort's calendar, using the real curriculum order: six teachings
 * Monday to Saturday and a live review on Sunday, one level a week. Progress
 * is read from the same devotion record the devotional report compiles, so a
 * tick here shows there too.
 */

export const COHORT_WEEKS = 4;

export type SogpDay = {
  dateKey: string;
  week: number;
  level: number;
  kind: "teaching" | "review";
  track: SogpCurriculumTrack | null;
};

export type SogpDayState = "complete" | "missed" | "today" | "upcoming";

export function sogpSchedule(today: string): SogpDay[] {
  const start = cohortStartFor(today);
  return Array.from({ length: COHORT_WEEKS * 7 }, (_, index) => {
    const week = Math.floor(index / 7);
    const position = index % 7;
    const review = position === 6;
    return {
      dateKey: shiftDate(start, index),
      week: week + 1,
      level: week + 1,
      kind: review ? "review" : "teaching",
      track: review ? null : (SOGP_TRACKS[week * 6 + position] ?? null),
    };
  });
}

export function cohortLabel(today: string): string {
  const start = new Date(`${cohortStartFor(today)}T00:00:00Z`);
  return `SOGP ${start.toLocaleString("en-GB", { month: "long", timeZone: "UTC" })} ${start.getUTCFullYear()}`;
}

export function levelTitle(level: number): string {
  return SOGP_LEVELS.find((item) => item.level === level)?.title ?? "";
}

export function teachingDone(day: DayActivity): boolean {
  return Boolean(day.sogp?.listened && day.sogp.quizAttempted);
}

export function prayedMorning(day: DayActivity): boolean {
  return day.prayerWatch.includes("morning");
}

export function isDayComplete(day: SogpDay, record: DayActivity): boolean {
  if (day.kind === "review") return Boolean(record.sogp?.reviewAttended);
  return teachingDone(record) && prayedMorning(record);
}

export function dayState(state: DemoState, personId: string, day: SogpDay): SogpDayState {
  const record = devotionFor(state, personId, day.dateKey);
  if (isDayComplete(day, record)) return "complete";
  if (day.dateKey === state.today) return "today";
  return day.dateKey < state.today ? "missed" : "upcoming";
}

export type SogpProgress = {
  teachings: number;
  teachingsTotal: number;
  prayerDays: number;
  elapsedDays: number;
  prayerPercent: number;
  reviews: number;
  reviewsTotal: number;
  currentWeek: number;
};

export function sogpProgress(state: DemoState, personId: string): SogpProgress {
  const schedule = sogpSchedule(state.today);
  const elapsed = schedule.filter((day) => day.dateKey <= state.today);
  let teachings = 0;
  let prayerDays = 0;
  let reviews = 0;
  for (const day of elapsed) {
    const record = devotionFor(state, personId, day.dateKey);
    if (day.kind === "teaching" && teachingDone(record)) teachings += 1;
    if (day.kind === "review" && record.sogp?.reviewAttended) reviews += 1;
    if (record.prayerWatch.length > 0) prayerDays += 1;
  }
  return {
    teachings,
    teachingsTotal: SOGP_TRACKS.length,
    prayerDays,
    elapsedDays: elapsed.length,
    prayerPercent: elapsed.length ? Math.round((prayerDays / elapsed.length) * 100) : 0,
    reviews,
    reviewsTotal: COHORT_WEEKS,
    currentWeek: Math.min(COHORT_WEEKS, elapsed.at(-1)?.week ?? 1),
  };
}

export type DiscipleStatus = "on_track" | "declining" | "at_risk";

export const DISCIPLE_STATUS_LABELS: Record<DiscipleStatus, string> = {
  on_track: "On track",
  declining: "Slowing down",
  at_risk: "At risk",
};

/** A discipler's view of the last seven days: participation only, never answers. */
export function recentParticipation(state: DemoState, personId: string) {
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(state.today, index - 6));
  const schedule = new Map(sogpSchedule(state.today).map((day) => [day.dateKey, day]));
  let teachingDays = 0;
  let teachingsDone = 0;
  let prayer = 0;
  for (const dateKey of days) {
    const record = devotionFor(state, personId, dateKey);
    if (record.prayerWatch.length > 0) prayer += 1;
    const day = schedule.get(dateKey);
    if (day?.kind === "teaching" && dateKey < state.today) {
      teachingDays += 1;
      if (teachingDone(record)) teachingsDone += 1;
    }
  }
  const ratio = teachingDays ? teachingsDone / teachingDays : 1;
  const status: DiscipleStatus =
    ratio >= 0.6 && prayer >= 4 ? "on_track" : ratio >= 0.3 || prayer >= 3 ? "declining" : "at_risk";
  return { prayerDays: prayer, teachingsDone, teachingDays, status };
}
