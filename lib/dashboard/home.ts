import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration } from "@/lib/community/daily-report";
import type { StatusTone } from "@/components/dashboard/v3/primitives";

export type HomeReport = { category: DailyReportCategory; title: string; description: string; status: string; tone: StatusTone };
export function homeReportRows(input: { devotionalCount: number; ministryCount: number; meetingCount: number; declarations: { category: string; declaration: string }[] }): HomeReport[] {
  return (["devotional", "ministry", "meetings"] as const).map(category => {
    const declaration = input.declarations.find(row => row.category === category)?.declaration as DailyReportDeclaration | undefined;
    const count = category === "devotional" ? input.devotionalCount : category === "ministry" ? input.ministryCount : input.meetingCount;
    const storedStatus = dailyCategoryStatus({ category, declaration: declaration ?? null, activityCount: count, hasDevotionalActivity: input.devotionalCount > 0 });
    const confirmed = category === "devotional" && declaration === "confirmed";
    const status = confirmed ? "Confirmed" : storedStatus === "reported" ? "Reported" : storedStatus === "nil" ? "Nil declared" : category === "devotional" && count > 0 ? "Not confirmed" : "Not reported";
    return {
      category, title: category === "devotional" ? "Devotional" : category === "ministry" ? "Ministry" : "Meetings",
      description: count > 0 ? `${count} ${category === "meetings" ? `meeting${count === 1 ? "" : "s"} recorded` : `activit${count === 1 ? "y" : "ies"} logged`}` : status === "Nil declared" ? "No activity declared" : "No activity logged",
      status, tone: confirmed || storedStatus === "reported" ? "green" : status === "Not confirmed" ? "amber" : status === "Nil declared" ? "lilac" : "neutral",
    };
  });
}

/** Paper adaptive home cards: start (blue), traditional, podcast (white, per-episode). */
export type HomeLearningCard =
  | { kind: "start"; href: string }
  | { kind: "traditional"; title: string; href: string; completed: number; total: number }
  | { kind: "podcast"; pace: 1 | 2; href: string; series: string; episodes: { part: string; duration: string; durationSeconds: number; positionSeconds: number; listened: boolean }[]; dayNumber: number };

export type HomeWeekDay = { dateKey: string; weekday: string; dayOfMonth: number; state: "complete" | "missed" | "current" | "future" | "outside"; isToday: boolean; hasReview: boolean };
export type HomeToday = {
  dateKey: string;
  dateLabel: string;
  week: HomeWeekDay[];
  /** Morning Prayer Watch for today; null outside the cohort's dates. */
  prayerWatch: { complete: boolean } | null;
  review: { title: string; when: string; href: string | null; complete: boolean } | null;
  done: number;
  total: number;
};
export type HomeSogp = {
  cohortTitle: string;
  weekLabel: string | null;
  today: HomeToday | null;
  progress: null | {
    learningLabel: string;
    learningDone: number;
    learningTotal: number;
    prayerPercent: number;
    prayerRequired: number;
    reviewsSatisfied: number;
    reviewsOwed: number;
    checksPassed: number;
  };
  leaderboard: { rank: number; points: number } | null;
  group: { kind: "member"; groupName: string; leaderFirstName: string } | { kind: "leader"; groups: number; disciples: number } | { kind: "none" };
  shareDayNumber: number | null;
};

export type DashboardHomeData = {
  day: string;
  card?: HomeLearningCard;
  learning: { title: string; href: string; action: string; completed: number; total: number; enrolled: boolean; unit?: "tracks" | "episodes"; pathLabel?: string };
  reports: HomeReport[] | null;
  sogp?: HomeSogp | null;
};

type JourneyDay = {
  dateKey: string;
  state: "complete" | "missed" | "current" | "future";
  prayerWatchComplete: boolean;
  track: null | { dayNumber: number; assessmentComplete: boolean; accessible: boolean };
  review: null | { title: string; startsAt: string; liveUrl: string | null; recordingUrl: string | null; complete: boolean };
};

function dateKeyPlus(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Lagos-dated Monday–Sunday strip plus today's checklist, from the SOGP journey's own day states. */
export function homeSogpToday(days: JourneyDay[], todayKey: string, includeTeaching: boolean): HomeToday | null {
  const byDate = new Map(days.map(day => [day.dateKey, day]));
  // Before or after the cohort's dates there is no day to keep, so the section stays hidden.
  if (!byDate.has(todayKey)) return null;
  const monday = dateKeyPlus(todayKey, -((new Date(`${todayKey}T00:00:00.000Z`).getUTCDay() + 6) % 7));
  const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
  const week = Array.from({ length: 7 }, (_, index) => {
    const dateKey = dateKeyPlus(monday, index);
    const day = byDate.get(dateKey);
    return {
      dateKey,
      weekday: weekdayFormat.format(new Date(`${dateKey}T00:00:00.000Z`)),
      dayOfMonth: Number(dateKey.slice(8)),
      state: day ? day.state : "outside",
      isToday: dateKey === todayKey,
      hasReview: Boolean(day?.review),
    } satisfies HomeWeekDay;
  });
  const today = byDate.get(todayKey);
  const nextReview = days.find(day => day.dateKey >= todayKey && day.review && !day.review.complete)?.review ?? null;
  const reviewDay = today?.review ?? nextReview;
  const review = reviewDay ? {
    title: reviewDay.title,
    when: today?.review ? "Today" : new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(reviewDay.startsAt)),
    href: today?.review ? reviewDay.recordingUrl ?? reviewDay.liveUrl : null,
    complete: reviewDay.complete,
  } : null;
  const checks = today ? [
    ...(includeTeaching && today.track?.accessible ? [today.track.assessmentComplete] : []),
    today.prayerWatchComplete,
    ...(today.review ? [today.review.complete] : []),
  ] : [];
  return {
    dateKey: todayKey,
    dateLabel: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${todayKey}T00:00:00.000Z`)),
    week,
    prayerWatch: today ? { complete: today.prayerWatchComplete } : null,
    review,
    done: checks.filter(Boolean).length,
    total: checks.length,
  };
}

/** "Week 2 of 4" while the cohort runs; null before and after. */
export function cohortWeekLabel(startsAt: string, endsAt: string, todayKey: string) {
  const lagosKey = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date(iso));
  const start = lagosKey(startsAt), end = lagosKey(endsAt);
  if (todayKey < start || todayKey > end) return null;
  const dayIndex = (key: string) => Math.round(new Date(`${key}T00:00:00.000Z`).getTime() / 86_400_000);
  const total = Math.max(1, Math.ceil((dayIndex(end) - dayIndex(start) + 1) / 7));
  return `Week ${Math.min(total, Math.floor((dayIndex(todayKey) - dayIndex(start)) / 7) + 1)} of ${total}`;
}
