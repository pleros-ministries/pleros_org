import "server-only";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { hasAdvancedSogpInterest } from "@/lib/db/queries/advanced-sogp-interest";
import * as s from "@/lib/db/schema";
import { getReminderPreferences } from "@/lib/db/queries/notification-preferences";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getHomeDiscipleshipSummary } from "@/lib/db/queries/sogp-discipleship";
import { getActiveSogpJourney } from "@/lib/db/queries/sogp-journey";
import { getLearningCatalogue } from "@/lib/db/queries/learning-catalogue";
import { getNextLearning, getNextLearningCard, type NextLearningCard } from "@/lib/db/queries/next-learning";
import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";
import { lagosToday } from "@/lib/sogp/daily-date";
import { SOGP_LEVELS } from "@/lib/sogp/curriculum";
import { learningResume } from "@/lib/sogp/learning-view";
import { isPlanPath, type SogpLearningPath } from "@/lib/sogp/learning-input";
import { monthWindow } from "@/lib/leaderboard/monthly";

import { cohortWeekLabel, homeSogpToday } from "./home";
import { getMonthCalendarData, monthCarryNote } from "./month-data";

const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const opensFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Lagos" });

export type LearningHubData = {
  /** null before the learner has chosen a path. */
  path: SogpLearningPath | null;
  paceLabel: string;
  state: "start" | "preparing" | "active" | "completed" | "withdrawn";
  cohortTitle: string | null;
  weekLabel: string | null;
  card: { eyebrow: string; title: string; progress: string; done: number; total: number; href: string; action: string; level: number };
  /** Lessons from earlier days not yet done. Optional: today's lesson is never blocked by them. */
  catchUp: { count: number; days: string[]; href: string } | null;
  review: { title: string; when: string } | null;
  certificate: { available: boolean };
  discipler: { firstName: string } | null;
  doneCount: number;
  /** The four levels on the traditional path, for the SOGP page (Pastor, 21 October); empty on the podcast path. */
  levels: Array<{ level: number; title: string; done: number; total: number; state: "done" | "now" | "later"; opens: string | null }>;
  /** The learner asked to hear when Advanced SOGP opens (migration 0065). */
  advancedInterest: boolean;
  /**
   * After SOGP (Pastor, 21 October): `canChoose` once SOGP is finished or the
   * cohort has ended; `card` is the chosen next learning, which then heads Learning.
   */
  next: { canChoose: boolean; finished: boolean; card: NextLearningCard | null };
  /**
   * The rest of this month on Learning (user, 27 November): the next few days
   * in words, no counts strip. Null before a path or while a plan is unbuilt.
   */
  month: LearningMonth | null;
  /** The learning path, Welcome Pack → Pre-SOGP → SOGP (Pastor review, 18 October). */
  journey: {
    welcomePackDone: boolean;
    preSogp: { done: number; total: number };
    /** The shared month's name, for the SOGP page's link to it (Pastor, 25 November 2026). */
    month: string;
    prayerToday: boolean | null;
  };
};

export type LearningMonth = {
  /** "November" */
  name: string;
  daysLeft: number;
  /** Each day as a calendar tile: "Sat" over "28"; today is marked. */
  rows: Array<{ weekday: string; day: string; today: boolean; title: string; meta: string; href: string | null }>;
  note: string | null;
  empty: string | null;
};
/** "Fri 28 Nov" */
const weekdayShort = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Africa/Lagos" });
const addDays = (key: string, days: number) => new Date(new Date(`${key}T12:00:00.000Z`).getTime() + days * 86_400_000);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

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
  const [course, journey, group, advancedInterest, nextChoice] = await Promise.all([
    getSogpDashboardData(userId),
    getActiveSogpJourney(userId).catch(() => null),
    getHomeDiscipleshipSummary(userId).catch(() => ({ kind: "none" as const })),
    hasAdvancedSogpInterest(userId).catch(() => false),
    getNextLearning(userId).catch(() => null),
  ]);
  if (!course) return null;
  const [welcomePackDone, preSogp, nextCard] = await Promise.all([
    getReminderPreferences(userId).then(prefs => prefs.remindersSavedAt !== null).catch(() => false),
    preSogpCounts(userId, course.cohort.id).catch(() => ({ done: 0, total: 0 })),
    nextChoice ? getNextLearningCard(userId).catch(() => null) : null,
  ]);

  const podcast = Boolean(isPlanPath(state?.path) && state?.plan);
  const path = state?.revision ? state.path : course.tracks.some(track => track.completed) ? "traditional" : null;
  // A plan path saved before its plan is built (user, 24 November).
  const planless = isPlanPath(path) && !state?.plan;
  const paceLabel = path === "podcast_two" ? "30 min/day · Podcast" : path === "podcast_one" ? "15 min/day · Podcast" : path === "doctrinal" ? "One a day · Personalised path" : "1 hr/day · Doctrinal path";
  // Cohort status isn't kept current, so the cohort's own dates decide the phase.
  const now = Date.now();
  const starts = new Date(course.cohort.startsAt).getTime();
  const ends = new Date(course.cohort.endsAt).getTime();
  // No path yet asks for one first, whatever the cohort's dates (fix 1, 17 November walkthrough).
  const learnerState = course.learnerState === "withdrawn" ? "withdrawn"
    : !path ? "start"
    : course.learnerState === "completed" || now > ends ? "completed"
    : now < starts ? "preparing"
    : "active";

  const published = course.tracks.filter((track): track is typeof track & { dayNumber: number } => track.lesson.status === "published" && track.dayNumber != null);
  const doneCount = published.filter(track => track.completed).length;
  const next = published.find(track => track.accessible && !track.completed) ?? null;
  const today = journey ? homeSogpToday(journey.days, day, podcast ? null : undefined) : null;

  let card: LearningHubData["card"];
  const doctrinal = path === "doctrinal";
  const unit = doctrinal ? "teaching" : "episode";
  const catalogue = podcast ? new Map((await getLearningCatalogue().catch(() => [])).map(row => [row.guid, row])) : new Map<string, { title: string; series?: string }>();
  if (planless) {
    card = doctrinal
      ? { eyebrow: "Personalised path", title: "Choose your teachings", progress: "Your path is saved. Pick teachings from the Library next", done: 0, total: 0, href: "/dashboard/sogp/plan?path=doctrinal", action: "Choose teachings", level: 1 }
      : { eyebrow: "Podcast", title: "Finish building your plan", progress: `Your path is saved. Pick your ${path === "podcast_two" ? 60 : 30} episodes, or take ours`, done: 0, total: 0, href: `/dashboard/sogp/plan?path=${path}`, action: "Build my plan", level: 1 };
  } else if (podcast) {
    const waiting = learningResume(state);
    const first = waiting ? catalogue.get(waiting.episodeGuids[0]!)?.title ?? (doctrinal ? "Your personalised path" : "Your podcast plan") : "";
    const listened = state!.progress.listenedEpisodeGuids.length;
    const planned = new Set([...state!.plan!.episodeGuids, ...state!.plan!.historyEpisodeGuids]).size;
    card = waiting
      ? { eyebrow: `${doctrinal ? "Teaching" : "Episode"} ${Math.min(planned, listened + 1)} of ${planned}`, title: doctrinal ? first : first.replace(/\s*\(Part\s+\d+\)\s*$/i, ""), progress: doctrinal ? `${catalogue.get(waiting.episodeGuids[0]!)?.series ?? "From the Library"} · ${listened} of ${planned} teachings` : `${waiting.listened} of ${waiting.total} ${waiting.total === 1 ? "episode" : "episodes"} today · ${listened} of ${planned} in your plan`, done: listened, total: planned, href: `/dashboard/sogp/listen?day=${waiting.dayNumber}`, action: "Listen now", level: 1 }
      : { eyebrow: "Plan complete", title: "Choose what’s next", progress: `${plural(listened, unit)} listened`, done: listened, total: planned, href: "/dashboard/sogp/plan", action: "Edit your plan", level: 1 };
  } else {
    const track = next ?? published.at(-1) ?? null;
    const level = track?.curriculumLevel ?? 1;
    card = track
      ? { // The level alone; its name doesn't need saying on the card (user, 24 November).
      eyebrow: `Level ${level}`, title: track.lesson.title, progress: `Track ${track.dayNumber} of ${published.length} · ${doneCount} done`, done: doneCount, total: published.length, href: `/dashboard/sogp/course/day/${track.dayNumber}`, action: next ? `Resume track ${track.dayNumber}` : "Review your last track", level }
      : { eyebrow: "Traditional", title: "Your teachings open soon", progress: "Nothing released yet", done: 0, total: 0, href: "/dashboard/sogp/month", action: "Open this month", level: 1 };
  }

  // Missed earlier days with an open, unfinished teaching. Never blocks today.
  const missed = !podcast && journey ? journey.days.filter(row => row.dateKey < day && row.track?.accessible && !row.track.assessmentComplete) : [];
  const catchUp = missed.length ? {
    count: missed.length,
    days: missed.slice(-3).map(row => weekdayFormat.format(new Date(`${row.dateKey}T00:00:00.000Z`))),
    href: `/dashboard/sogp/course/day/${missed[0]!.track!.dayNumber}`,
  } : null;

  const levels = podcast ? [] : SOGP_LEVELS.map(definition => {
    const tracks = published.filter(track => track.curriculumLevel === definition.level);
    const done = tracks.filter(track => track.completed).length;
    const firstRelease = tracks.map(track => new Date(track.releaseAt).getTime()).sort((a, b) => a - b)[0];
    const state: "done" | "now" | "later" = tracks.length && done === tracks.length ? "done" : tracks.some(track => track.accessible) ? "now" : "later";
    return { level: definition.level, title: definition.title, done, total: tracks.length || definition.tracks.length, state, opens: state === "later" && firstRelease ? opensFormat.format(new Date(firstRelease)) : null };
  });

  // The shared month (Pastor, 25 November 2026): your next days, dated, then one line on what follows.
  let month: LearningMonth | null = null;
  if (path && !planless) {
    const data = await getMonthCalendarData(userId, { state, course }).catch(() => null);
    const window = data?.month ?? monthWindow(day);
    month = {
      name: window.name,
      daysLeft: window.daysLeft,
      rows: (data?.rest ?? []).slice(0, 3).map(({ dateKey, item }) => ({ weekday: weekdayShort.format(addDays(dateKey, 0)), day: String(Number(dateKey.slice(8))), today: dateKey === day, title: item.title, meta: item.meta, href: item.href ?? null })),
      note: (data ? monthCarryNote(data) : null) ?? (path === "traditional" ? "A track a day, with a group review at the end of each level." : null),
      empty: data?.rest.length ? null : podcast ? "Your plan is done. Choose what’s next." : `Nothing left to learn in ${window.name}.`,
    };
  }

  const finishedSogp = (!podcast && published.length > 0 && doneCount >= published.length) || (podcast && card.eyebrow === "Plan complete");
  const canChooseNext = learnerState !== "withdrawn" && (finishedSogp || learnerState === "completed");

  return {
    path,
    paceLabel,
    state: learnerState,
    cohortTitle: course.cohort.title ?? null,
    weekLabel: journey ? cohortWeekLabel(journey.cohort.startsAt, journey.cohort.endsAt, day) : null,
    card,
    catchUp,
    review: today?.review ? { title: today.review.title, when: today.review.when } : null,
    certificate: { available: Boolean(course.certificate && !course.certificate.revokedAt) },
    discipler: group.kind === "member" ? { firstName: group.leaderFirstName } : null,
    doneCount,
    levels,
    advancedInterest,
    next: { canChoose: canChooseNext, finished: finishedSogp, card: canChooseNext ? nextCard : null },
    month,
    journey: {
      welcomePackDone,
      preSogp,
      month: monthWindow(day).name,
      prayerToday: journey ? journey.days.find(row => row.dateKey === day)?.prayerWatchComplete ?? null : null,
    },
  };
}
