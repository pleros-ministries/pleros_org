import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration } from "@/lib/community/daily-report";
import type { StatusTone } from "@/components/dashboard/v3/primitives";
import type { previewMonthlyLeaderboard } from "@/lib/leaderboard/monthly";
import type { CalendarDay } from "@/lib/learning/month-calendar";

export type HomeReport = { category: DailyReportCategory; title: string; description: string; status: string; tone: StatusTone };
export function homeReportRows(input: { devotionalCount: number; ministryCount: number; meetingCount: number; declarations: { category: string; declaration: string }[] }): HomeReport[] {
  return (["devotional", "ministry", "meetings"] as const).map(category => {
    const declaration = input.declarations.find(row => row.category === category)?.declaration as DailyReportDeclaration | undefined;
    const count = category === "devotional" ? input.devotionalCount : category === "ministry" ? input.ministryCount : input.meetingCount;
    const storedStatus = dailyCategoryStatus({ category, declaration: declaration ?? null, activityCount: count, hasDevotionalActivity: input.devotionalCount > 0 });
    const confirmed = category === "devotional" && declaration === "confirmed";
    const status = confirmed ? "Confirmed" : storedStatus === "reported" ? "Reported" : storedStatus === "nil" ? "Nil declared" : category === "devotional" && count > 0 ? "Not confirmed" : "Not reported";
    return {
      category, title: category === "devotional" ? "Devotion" : category === "ministry" ? "Ministry" : "Meetings",
      description: count > 0 ? `${count} ${category === "meetings" ? `meeting${count === 1 ? "" : "s"} recorded` : `activit${count === 1 ? "y" : "ies"} logged`}` : status === "Nil declared" ? "No activity declared" : "No activity logged",
      status, tone: confirmed || storedStatus === "reported" ? "green" : status === "Not confirmed" ? "amber" : status === "Nil declared" ? "lilac" : "neutral",
    };
  });
}

/** Paper adaptive home cards: start (blue), traditional, podcast (white, per-episode). */
export type HomeLearningCard =
  /** No path yet, or a plan path saved before its plan; the copy defaults to choosing a path. */
  | { kind: "start"; href: string; meta?: string; title?: string; summary?: string; action?: string }
  | { kind: "traditional"; title: string; href: string; completed: number; total: number; level?: number }
  | { kind: "podcast"; pace: 1 | 2; href: string; doctrinal?: boolean; series: string; episodes: { part: string; duration: string; durationSeconds: number; positionSeconds: number; listened: boolean }[]; dayNumber: number };

export type HomeToday = {
  dateKey: string;
  dateLabel: string;
  /** Today's teaching: the traditional track (ticked when listened) or the podcast day (ticked by the player). */
  teaching: { title: string; href: string; done: boolean; dayNumber: number | null; podcast: boolean; questionGuid: string | null } | null;
  /** The 5:30 am Prayer Watch, every day of the month (Pastor, 25 November 2026). */
  prayerWatch: { complete: boolean };
  /** The traditional path's quiz and written response, marked done when finished; null on the podcast path. */
  assessment: { complete: boolean; href: string } | null;
  /** Kept for Learning and the SOGP page; Home's Today no longer shows it. */
  review: { title: string; when: string; href: string | null; complete: boolean } | null;
  done: number;
  total: number;
};
/** The shared month on Home's Today: what you did each day, and your plan to the month's end. */
export type HomeMonth = { key: string; name: string; todayKey: string; daysLeft: number; daysSoFar: number; podcast: boolean; days: Record<string, CalendarDay> };
export type HomeSogp = {
  cohortTitle: string;
  weekLabel: string | null;
  today: HomeToday | null;
  month: HomeMonth | null;
  /** The same three as Today (Pastor, 21 October), from what's ticked each day. */
  progress: null | {
    teaching: { done: number; total: number; unit: "days" | "episodes" };
    prayer: { percent: number; required: number };
    /** Null on the podcast path, which has no assessments. */
    assessment: { done: number; total: number } | null;
  };
  /** The learner's invite link and code for Home's Invite someone panel (Pastor, 20 October). */
  invite?: { code: string; url: string; joined: number } | null;
  group: { kind: "member"; groupName: string; leaderFirstName: string } | { kind: "leader"; groups: number; disciples: number } | { kind: "none" };
  shareDayNumber: number | null;
};

/**
 * This month's leaderboard for Home (Pastor, 25 November 2026): the top five
 * and you, for everyone signed in. `me` is null while you have no points or
 * have hidden yourself; `points` is yours either way.
 */
export type HomeLeaderboard = ReturnType<typeof previewMonthlyLeaderboard>;

export type DashboardHomeData = {
  day: string;
  card?: HomeLearningCard;
  learning: { title: string; href: string; action: string; completed: number; total: number; enrolled: boolean; unit?: "tracks" | "episodes"; pathLabel?: string };
  reports: HomeReport[] | null;
  sogp?: HomeSogp | null;
  /** Welcome Pack stays on Home until its last step (reminders) is saved. */
  welcomePack?: { done: boolean } | null;
  leaderboard?: HomeLeaderboard | null;
};

type JourneyDay = {
  dateKey: string;
  kind: "weekday" | "weekend" | "review";
  state: "complete" | "missed" | "current" | "future";
  prayerWatchComplete: boolean;
  track: null | { lessonId: number; dayNumber: number; title: string; assessmentComplete: boolean; quizPassed: boolean; audioListened: boolean; accessible: boolean };
  review: null | { title: string; startsAt: string; liveUrl: string | null; recordingUrl: string | null; complete: boolean };
};
/** On the podcast path, today's listening comes from the plan (the player ticks it). */
export type HomePodcastTeaching = { title: string; href: string; done: boolean } | null;

/**
 * Today on Home: three things to tick, Teaching (listened), Prayer Watch, and
 * Assessment on the traditional path (done once the quiz and written response
 * are). The calendar above them is the shared month (Pastor, 25 November 2026),
 * so Today shows every day, before and after the cohort's own dates. After the
 * cohort, Teaching and Assessment are the first track still to catch up.
 * `podcast` is today's listening on the podcast path, which has no assessment;
 * undefined means traditional. `morningPrayed` ticks Prayer Watch on days
 * outside the cohort.
 */
export function homeSogpToday(days: JourneyDay[], todayKey: string, podcast?: HomePodcastTeaching, morningPrayed = false): HomeToday {
  const today = days.find(day => day.dateKey === todayKey);
  const lastKey = days.map(day => day.dateKey).sort().at(-1);
  const after = !today && lastKey !== undefined && todayKey > lastKey;
  const nextReview = days.find(day => day.dateKey >= todayKey && day.review && !day.review.complete)?.review ?? null;
  const reviewDay = today?.review ?? nextReview;
  const review = reviewDay ? {
    title: reviewDay.title,
    when: today?.review ? "Today" : new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(reviewDay.startsAt)),
    href: today?.review ? reviewDay.recordingUrl ?? reviewDay.liveUrl : null,
    complete: reviewDay.complete,
  } : null;
  // After the cohort, the first teaching day not yet listened to and assessed.
  const behind = after && podcast === undefined ? days.find(day => day.track?.accessible && !(day.track.audioListened && day.track.assessmentComplete))?.track ?? null : null;
  const track = podcast === undefined ? (after ? behind : today?.track?.accessible ? today.track : null) : null;
  const teaching = podcast ? { title: podcast.title, href: podcast.href, done: podcast.done, dayNumber: null, podcast: true, questionGuid: null }
    : track ? { title: after ? `Track ${track.dayNumber} · ${track.title}` : track.title, href: `/dashboard/sogp/course/day/${track.dayNumber}`, done: track.audioListened, dayNumber: track.dayNumber, podcast: false, questionGuid: `sogp-lesson-${track.lessonId}` }
    : null;
  const assessment = track ? { complete: track.assessmentComplete, href: `/dashboard/sogp/course/day/${track.dayNumber}` } : null;
  const prayerWatch = { complete: today ? today.prayerWatchComplete || morningPrayed : morningPrayed };
  const checks = [...(teaching ? [teaching.done] : []), prayerWatch.complete, ...(assessment ? [assessment.complete] : [])];
  return {
    dateKey: todayKey,
    dateLabel: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${todayKey}T00:00:00.000Z`)),
    teaching,
    prayerWatch,
    assessment,
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
