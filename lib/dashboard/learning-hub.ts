import "server-only";

import { and, count, eq } from "drizzle-orm";

import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getReminderPreferences } from "@/lib/db/queries/notification-preferences";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getHomeDiscipleshipSummary } from "@/lib/db/queries/sogp-discipleship";
import { getActiveSogpJourney } from "@/lib/db/queries/sogp-journey";
import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";
import { getSogpLeaderboard } from "@/lib/db/queries/sogp-leaderboard";
import { lagosToday } from "@/lib/sogp/daily-date";
import { learningResume } from "@/lib/sogp/learning-view";
import { buildSogpDays } from "@/lib/sogp/sogp-days";

import { cohortWeekLabel, homeSogpToday, type HomeWeekDay } from "./home";

const LEVEL_NAMES: Record<number, string> = { 1: "Gospel", 2: "Foundations", 3: "Walk of faith", 4: "Purpose" };
const releaseFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

export type LearningHubData = {
  /** null before the learner has chosen a path. */
  path: "traditional" | "podcast_one" | "podcast_two" | null;
  paceLabel: string;
  state: "start" | "preparing" | "active" | "completed" | "withdrawn";
  cohortTitle: string | null;
  weekLabel: string | null;
  card: { eyebrow: string; title: string; progress: string; done: number; total: number; href: string; action: string; level: number };
  /** Lessons from earlier days not yet done. Optional: today's lesson is never blocked by them. */
  catchUp: { count: number; days: string[]; href: string } | null;
  week: HomeWeekDay[] | null;
  upNext: Array<{ key: string; number: number; title: string; meta: string; href: string | null; current: boolean }>;
  review: { title: string; when: string } | null;
  certificate: { available: boolean };
  leaderboard: { top: Array<{ rank: number; name: string; points: number; isMe: boolean }>; me: { rank: number; points: number } | null; total: number } | null;
  discipler: { firstName: string } | null;
  doneCount: number;
  /** The learning path, Welcome Pack → Pre-SOGP → SOGP (Pastor review, 18 October). */
  journey: {
    welcomePackDone: boolean;
    preSogp: { done: number; total: number };
    /** Numbered SOGP days: 24 teaching days plus the review days. */
    days: { current: number | null; total: number; teaching: number; reviews: number } | null;
    prayerToday: boolean | null;
  };
};

/** Pre-SOGP days done and published for the learner's enrolment in this cohort. */
async function preSogpCounts(userId: string, cohortId: number) {
  const [enrollment] = await db.select({ id: s.sogpEnrollments.id }).from(s.sogpEnrollments)
    .where(and(eq(s.sogpEnrollments.userId, userId), eq(s.sogpEnrollments.cohortId, cohortId))).limit(1);
  if (!enrollment) return { done: 0, total: 0 };
  const [[done], [total]] = await Promise.all([
    db.select({ n: count() }).from(s.sogpPreparationCompletions).where(eq(s.sogpPreparationCompletions.enrollmentId, enrollment.id)),
    db.select({ n: count() }).from(s.sogpPreparationDays).where(eq(s.sogpPreparationDays.cohortId, cohortId)),
  ]);
  return { done: done?.n ?? 0, total: total?.n ?? 0 };
}

/**
 * Read-only projection for My learning, built from the same reads as the You
 * home. `state` is the learner's saved path and plan, already loaded by the
 * page: reading it again would queue behind the same per-learner lock.
 */
export async function getLearningHubData(userId: string, state: SogpLearningState | null): Promise<LearningHubData | null> {
  const day = lagosToday();
  // Certification facts are left to the readiness page: they repeat every read below.
  const [course, journey, leaderboard, group] = await Promise.all([
    getSogpDashboardData(userId),
    getActiveSogpJourney(userId).catch(() => null),
    getSogpLeaderboard(userId).catch(() => null),
    getHomeDiscipleshipSummary(userId).catch(() => ({ kind: "none" as const })),
  ]);
  if (!course) return null;
  const [welcomePackDone, preSogp] = await Promise.all([
    getReminderPreferences(userId).then(prefs => prefs.remindersSavedAt !== null).catch(() => false),
    preSogpCounts(userId, course.cohort.id).catch(() => ({ done: 0, total: 0 })),
  ]);

  const podcast = Boolean(state?.path && state.path !== "traditional" && state.plan);
  const path = state?.revision ? state.path : course.tracks.some(track => track.completed) ? "traditional" : null;
  const paceLabel = path === "podcast_two" ? "30 min/day · Podcast" : path === "podcast_one" ? "15 min/day · Podcast" : "1 hr/day · Traditional";
  // Cohort status isn't kept current, so the cohort's own dates decide the phase.
  const now = Date.now();
  const starts = new Date(course.cohort.startsAt).getTime();
  const ends = new Date(course.cohort.endsAt).getTime();
  const learnerState = course.learnerState === "withdrawn" ? "withdrawn"
    : course.learnerState === "completed" || now > ends ? "completed"
    : now < starts ? "preparing"
    : path ? "active" : "start";

  const published = course.tracks.filter((track): track is typeof track & { dayNumber: number } => track.lesson.status === "published" && track.dayNumber != null);
  const doneCount = published.filter(track => track.completed).length;
  const next = published.find(track => track.accessible && !track.completed) ?? null;
  const today = journey ? homeSogpToday(journey.days, day, !podcast) : null;

  let card: LearningHubData["card"];
  if (podcast) {
    const waiting = learningResume(state);
    const titles = waiting ? new Map((await fetchAnchorEpisodes().catch(() => [])).map(row => [row.guid, row.title])) : new Map<string, string>();
    const first = waiting ? titles.get(waiting.episodeGuids[0]!) ?? "Your podcast plan" : "Your podcast plan";
    const listened = state!.progress.listenedEpisodeGuids.length;
    const planned = new Set([...state!.plan!.episodeGuids, ...state!.plan!.historyEpisodeGuids]).size;
    card = waiting
      ? { eyebrow: `Day ${waiting.dayNumber}`, title: first.replace(/\s*\(Part\s+\d+\)\s*$/i, ""), progress: `${waiting.listened} of ${waiting.total} ${waiting.total === 1 ? "episode" : "episodes"} today · ${listened} of ${planned} in your plan`, done: listened, total: planned, href: `/dashboard/sogp/listen?day=${waiting.dayNumber}`, action: `Resume day ${waiting.dayNumber}`, level: 1 }
      : { eyebrow: "Plan complete", title: "Choose what’s next", progress: `${listened} episodes listened`, done: listened, total: planned, href: "/dashboard/sogp/plan", action: "Edit your plan", level: 1 };
  } else {
    const track = next ?? published.at(-1) ?? null;
    const level = track?.curriculumLevel ?? 1;
    card = track
      ? { eyebrow: `Level ${level} · ${LEVEL_NAMES[level] ?? "SOGP"}`, title: track.lesson.title, progress: `Track ${track.dayNumber} of ${published.length} · ${doneCount} done`, done: doneCount, total: published.length, href: `/dashboard/sogp/course/day/${track.dayNumber}`, action: next ? `Resume track ${track.dayNumber}` : "Review your last track", level }
      : { eyebrow: "Traditional", title: "Your teachings open soon", progress: "Nothing released yet", done: 0, total: 0, href: "/dashboard/sogp/traditional", action: "Open your calendar", level: 1 };
  }

  // Missed earlier days with an open, unfinished teaching. Never blocks today.
  const missed = !podcast && journey ? journey.days.filter(row => row.dateKey < day && row.track?.accessible && !row.track.assessmentComplete) : [];
  const catchUp = missed.length ? {
    count: missed.length,
    days: missed.slice(-3).map(row => weekdayFormat.format(new Date(`${row.dateKey}T00:00:00.000Z`))),
    href: `/dashboard/sogp/course/day/${missed[0]!.track!.dayNumber}`,
  } : null;

  const upNext = podcast ? [] : published.filter(track => !track.completed).slice(0, 3).map(track => ({
    key: `track-${track.id}`,
    number: track.dayNumber,
    title: track.lesson.title,
    meta: track.accessible ? (track.id === next?.id ? "Ready now · lesson, quiz, written response" : "Ready") : `Opens ${releaseFormat.format(new Date(track.releaseAt))}`,
    href: track.accessible ? `/dashboard/sogp/course/day/${track.dayNumber}` : null,
    current: track.id === next?.id,
  }));

  return {
    path,
    paceLabel,
    state: learnerState,
    cohortTitle: course.cohort.title ?? null,
    weekLabel: journey ? cohortWeekLabel(journey.cohort.startsAt, journey.cohort.endsAt, day) : null,
    card,
    catchUp,
    week: today?.week ?? null,
    upNext,
    review: today?.review ? { title: today.review.title, when: today.review.when } : null,
    certificate: { available: Boolean(course.certificate && !course.certificate.revokedAt) },
    leaderboard: leaderboard ? {
      top: leaderboard.top.slice(0, 5).map(row => ({ rank: row.rank, name: row.name, points: row.points, isMe: row.isMe })),
      me: leaderboard.me ? { rank: leaderboard.me.rank, points: leaderboard.me.points } : null,
      total: leaderboard.total,
    } : null,
    discipler: group.kind === "member" ? { firstName: group.leaderFirstName } : null,
    doneCount,
    journey: {
      welcomePackDone,
      preSogp,
      days: journey && !podcast ? (() => {
        const plan = buildSogpDays(journey.days, day);
        return plan.days.length ? { current: plan.current?.number ?? null, total: plan.days.length, teaching: plan.teachingDays, reviews: plan.reviewDays } : null;
      })() : null,
      prayerToday: journey ? journey.days.find(row => row.dateKey === day)?.prayerWatchComplete ?? null : null,
    },
  };
}
