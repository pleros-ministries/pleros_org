import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration } from "@/lib/community/daily-report";
import type { StatusTone } from "@/components/dashboard/v3/primitives";
import { buildSogpDays } from "@/lib/sogp/sogp-days";

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
  | { kind: "start"; href: string }
  | { kind: "traditional"; title: string; href: string; completed: number; total: number; level?: number }
  | { kind: "podcast"; pace: 1 | 2; href: string; series: string; episodes: { part: string; duration: string; durationSeconds: number; positionSeconds: number; listened: boolean }[]; dayNumber: number };

/** One SOGP day on Home's Today (Pastor, 21 October): numbered through the cohort, teaching and review days alike. */
export type HomeSogpDay = { number: number; dateKey: string; weekday: string; dayOfMonth: number; state: "done" | "missed" | "today" | "later"; review: boolean };
export type HomeToday = {
  dateKey: string;
  dateLabel: string;
  /** Every SOGP day; Home shows today's week and opens the rest. */
  sogpDays: HomeSogpDay[];
  /** Today's SOGP day, or null when today isn't one. */
  dayNumber: number | null;
  /** Today's teaching: the traditional track (ticked when listened) or the podcast day (ticked by the player). */
  teaching: { title: string; href: string; done: boolean; dayNumber: number | null; podcast: boolean; questionGuid: string | null } | null;
  /** Morning Prayer Watch for today; null outside the cohort's dates. */
  prayerWatch: { complete: boolean } | null;
  /** The traditional path's quiz and written response, marked done when finished; null on the podcast path. */
  assessment: { complete: boolean; href: string } | null;
  /** Kept for Learning and the SOGP page; Home's Today no longer shows it. */
  review: { title: string; when: string; href: string | null; complete: boolean } | null;
  done: number;
  total: number;
};
export type HomeSogp = {
  cohortTitle: string;
  weekLabel: string | null;
  today: HomeToday | null;
  /** The same three as Today (Pastor, 21 October), from what's ticked each day. */
  progress: null | {
    teaching: { done: number; total: number; unit: "days" | "episodes" };
    prayer: { percent: number; required: number };
    /** Null on the podcast path, which has no assessments. */
    assessment: { done: number; total: number } | null;
  };
  leaderboard: { rank: number; points: number } | null;
  /** The cohort's top five and the viewer, for Home's leaderboard preview (Pastor, 20 October). */
  /** The learner's invite link and code for Home's Invite someone panel (Pastor, 20 October). */
  invite?: { code: string; url: string; joined: number } | null;
  board?: { top: Array<{ rank: number; name: string; points: number; isMe: boolean }>; me: { rank: number; points: number } | null; total: number } | null;
  group: { kind: "member"; groupName: string; leaderFirstName: string } | { kind: "leader"; groups: number; disciples: number } | { kind: "none" };
  shareDayNumber: number | null;
};

export type DashboardHomeData = {
  day: string;
  card?: HomeLearningCard;
  learning: { title: string; href: string; action: string; completed: number; total: number; enrolled: boolean; unit?: "tracks" | "episodes"; pathLabel?: string };
  reports: HomeReport[] | null;
  sogp?: HomeSogp | null;
  /** Welcome Pack stays on Home until its last step (reminders) is saved. */
  welcomePack?: { done: boolean } | null;
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
 * Today on Home (Pastor, 21 October): your SOGP days, numbered from the cohort's
 * first day (teaching and review days alike), and three things to tick:
 * Teaching (listened), Prayer Watch, and Assessment on the traditional path
 * (done once the quiz and written response are). `podcast` is today's listening
 * on the podcast path, which has no assessment; undefined means traditional.
 */
export function homeSogpToday(days: JourneyDay[], todayKey: string, podcast?: HomePodcastTeaching): HomeToday | null {
  const byDate = new Map(days.map(day => [day.dateKey, day]));
  // Before or after the cohort's dates there is no day to keep, so the section stays hidden.
  if (!byDate.has(todayKey)) return null;
  const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
  const plan = buildSogpDays(days.map(day => ({
    dateKey: day.dateKey, kind: day.kind, prayerWatchComplete: day.prayerWatchComplete,
    track: day.track ? { dayNumber: day.track.dayNumber, title: day.track.title, accessible: day.track.accessible, quizPassed: day.track.quizPassed, assessmentComplete: day.track.assessmentComplete } : null,
    review: day.review ? { title: day.review.title, complete: day.review.complete } : null,
  })), todayKey);
  const sogpDays: HomeSogpDay[] = plan.days.map(day => ({
    number: day.number,
    dateKey: day.dateKey,
    weekday: weekdayFormat.format(new Date(`${day.dateKey}T00:00:00.000Z`)),
    dayOfMonth: Number(day.dateKey.slice(8)),
    state: day.isToday ? "today" : day.complete ? "done" : day.past ? "missed" : "later",
    review: day.kind === "review",
  }));
  const today = byDate.get(todayKey);
  const nextReview = days.find(day => day.dateKey >= todayKey && day.review && !day.review.complete)?.review ?? null;
  const reviewDay = today?.review ?? nextReview;
  const review = reviewDay ? {
    title: reviewDay.title,
    when: today?.review ? "Today" : new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(new Date(reviewDay.startsAt)),
    href: today?.review ? reviewDay.recordingUrl ?? reviewDay.liveUrl : null,
    complete: reviewDay.complete,
  } : null;
  const track = podcast === undefined && today?.track?.accessible ? today.track : null;
  const teaching = podcast ? { title: podcast.title, href: podcast.href, done: podcast.done, dayNumber: null, podcast: true, questionGuid: null }
    : track ? { title: track.title, href: `/dashboard/sogp/course/day/${track.dayNumber}`, done: track.audioListened, dayNumber: track.dayNumber, podcast: false, questionGuid: `sogp-lesson-${track.lessonId}` }
    : null;
  const assessment = track ? { complete: track.assessmentComplete, href: `/dashboard/sogp/course/day/${track.dayNumber}` } : null;
  const checks = today ? [
    ...(teaching ? [teaching.done] : []),
    today.prayerWatchComplete,
    ...(assessment ? [assessment.complete] : []),
  ] : [];
  return {
    dateKey: todayKey,
    dateLabel: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${todayKey}T00:00:00.000Z`)),
    sogpDays,
    dayNumber: sogpDays.find(day => day.dateKey === todayKey)?.number ?? null,
    teaching,
    prayerWatch: today ? { complete: today.prayerWatchComplete } : null,
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
