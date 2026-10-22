import "server-only";

import { and, asc, eq, exists, isNotNull, ne, notExists, sql } from "drizzle-orm";

import { fetchAnchorEpisodes, type RssEpisode } from "@/lib/anchor-rss";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import {
  buildPodcastJourneyDays,
  buildPodcastSeriesCatalogue,
  PODCAST_OWN_MAX,
  PODCAST_OWN_TRACK,
  resolvePodcastJourney,
  summarisePodcastJourney,
} from "@/lib/podcast-journey";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

import { ensurePodcastJourney } from "./podcast-journey";
import { getPodcastEpisodeProgress } from "./podcast-progress";
import { getMorningPrayerWatchDateKeys } from "./prayer-watch";

/**
 * The next phase after SOGP (Pastor, 21 October; migration 0076). Someone who
 * has finished SOGP chooses what they learn next, and it becomes their current
 * learning on Learning. Only what exists is offered: podcast journeys (the
 * Foundations plan, a Library series or episodes they pick) and teachings
 * SOGP doesn't use that have audio and a quiz.
 */

export type NextLearningChoice = { kind: "podcast"; lessonId: null } | { kind: "lesson"; lessonId: number };

/** Postgres "relation does not exist": migration 0076 isn't applied yet. */
function missingTable(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

export async function getNextLearning(userId: string): Promise<NextLearningChoice | null> {
  try {
    const [row] = await db.select({ kind: s.nextLearning.kind, lessonId: s.nextLearning.lessonId }).from(s.nextLearning).where(eq(s.nextLearning.userId, userId)).limit(1);
    if (!row) return null;
    return row.kind === "lesson" && row.lessonId != null ? { kind: "lesson", lessonId: row.lessonId } : { kind: "podcast", lessonId: null };
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
}

/** Teachings to offer: published, with audio and a quiz, and not taught in any SOGP cohort. */
export async function getNextLessonOptions() {
  return db.select({ id: s.lessons.id, title: s.lessons.title, levelId: s.lessons.levelId })
    .from(s.lessons)
    .where(and(
      eq(s.lessons.status, "published"),
      isNotNull(s.lessons.audioUrl),
      ne(s.lessons.audioUrl, ""),
      exists(db.select({ one: sql`1` }).from(s.quizQuestions).where(eq(s.quizQuestions.lessonId, s.lessons.id))),
      notExists(db.select({ one: sql`1` }).from(s.sogpCohortTracks).where(eq(s.sogpCohortTracks.lessonId, s.lessons.id))),
    ))
    .orderBy(asc(s.lessons.levelId), asc(s.lessons.lessonNumber));
}

/** Podcast choices restart the journey at Day 1 today; listened episodes stay ticked. */
export async function chooseNextPodcast(userId: string, track: string) {
  const today = toLagosDateKey(new Date());
  await db.transaction(async tx => {
    await tx.insert(s.podcastJourneys).values({ userId, track, startedOn: today })
      .onConflictDoUpdate({ target: s.podcastJourneys.userId, set: { track, startedOn: today, updatedAt: sql`now()` } });
    await tx.insert(s.nextLearning).values({ userId, kind: "podcast", lessonId: null })
      .onConflictDoUpdate({ target: s.nextLearning.userId, set: { kind: "podcast", lessonId: null, chosenAt: sql`now()` } });
  });
}

export async function chooseNextLesson(userId: string, lessonId: number) {
  await db.insert(s.nextLearning).values({ userId, kind: "lesson", lessonId })
    .onConflictDoUpdate({ target: s.nextLearning.userId, set: { kind: "lesson", lessonId, chosenAt: sql`now()` } });
}

export async function getOwnJourneyGuids(userId: string): Promise<string[]> {
  try {
    const rows = await db.select({ guid: s.podcastJourneyEpisodes.episodeGuid }).from(s.podcastJourneyEpisodes)
      .where(eq(s.podcastJourneyEpisodes.userId, userId)).orderBy(asc(s.podcastJourneyEpisodes.position));
    return rows.map(row => row.guid);
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }
}

/** Replaces the listener's own journey and makes it their current learning from Day 1 today. */
export async function saveOwnJourney(userId: string, guids: string[]) {
  const unique = [...new Set(guids)].slice(0, PODCAST_OWN_MAX);
  const today = toLagosDateKey(new Date());
  await db.transaction(async tx => {
    await tx.delete(s.podcastJourneyEpisodes).where(eq(s.podcastJourneyEpisodes.userId, userId));
    if (unique.length) await tx.insert(s.podcastJourneyEpisodes).values(unique.map((episodeGuid, position) => ({ userId, position, episodeGuid })));
    await tx.insert(s.podcastJourneys).values({ userId, track: PODCAST_OWN_TRACK, startedOn: today })
      .onConflictDoUpdate({ target: s.podcastJourneys.userId, set: { track: PODCAST_OWN_TRACK, startedOn: today, updatedAt: sql`now()` } });
    await tx.insert(s.nextLearning).values({ userId, kind: "podcast", lessonId: null })
      .onConflictDoUpdate({ target: s.nextLearning.userId, set: { kind: "podcast", lessonId: null, chosenAt: sql`now()` } });
  });
}

/** Own-journey guids as feed episodes, in order; episodes gone from the feed are left out. */
export function ownJourneyEpisodes(guids: readonly string[], episodes: readonly RssEpisode[]) {
  const byGuid = new Map(episodes.map(episode => [episode.guid, episode] as const));
  return guids.map(guid => byGuid.get(guid)).filter((episode): episode is RssEpisode => Boolean(episode));
}

export type NextLearningCard =
  | { kind: "podcast"; title: string; dayNumber: number; totalDays: number; listened: number; finished: boolean; episodeTitle: string | null; todayListened: boolean }
  | { kind: "lesson"; lessonId: number; title: string; done: number; total: number };

/** What Learning shows for the chosen next learning. */
export async function getNextLearningCard(userId: string, choice: NextLearningChoice): Promise<NextLearningCard | null> {
  if (choice.kind === "lesson") {
    const [lesson] = await db.select({ title: s.lessons.title }).from(s.lessons).where(eq(s.lessons.id, choice.lessonId)).limit(1);
    if (!lesson) return null;
    const [progress] = await db.select().from(s.studentProgress)
      .where(and(eq(s.studentProgress.userId, userId), eq(s.studentProgress.lessonId, choice.lessonId))).limit(1);
    const steps = [progress?.audioListened, progress?.notesRead, progress?.quizPassed];
    return { kind: "lesson", lessonId: choice.lessonId, title: lesson.title, done: steps.filter(Boolean).length, total: steps.length };
  }
  const today = toLagosDateKey(new Date());
  const journey = await ensurePodcastJourney(userId, today);
  const [episodes, listened, own, prayer] = await Promise.all([
    fetchAnchorEpisodes(),
    getPodcastEpisodeProgress(userId),
    getOwnJourneyGuids(userId),
    getMorningPrayerWatchDateKeys(userId, journey.startedOn, today),
  ]);
  const resolved = resolvePodcastJourney({
    track: journey.track,
    startedOn: journey.startedOn,
    catalogue: buildPodcastSeriesCatalogue(episodes),
    ownEpisodes: ownJourneyEpisodes(own, episodes),
  });
  if (resolved.kind !== "plan") return null;
  const days = buildPodcastJourneyDays({ planEpisodes: resolved.episodes, startedOn: resolved.startedOn, todayKey: today, listenedGuids: new Set(listened), prayerDateKeys: new Set(prayer) });
  const summary = summarisePodcastJourney(days, today);
  const day = days[summary.dayNumber - 1];
  return { kind: "podcast", title: resolved.title, ...summary, episodeTitle: day?.episode?.title ?? null, todayListened: day?.episodeListened ?? false };
}

export type NextLesson = {
  id: number;
  title: string;
  audioUrl: string | null;
  notesContent: string | null;
  progress: { audioListened: boolean; notesRead: boolean; quizPassed: boolean };
  bestScore: number | null;
  questions: Array<{ id: number; questionType: "multiple_choice" | "short_text"; questionText: string; options: string[] | null }>;
};

/** The chosen teaching, only when it is the learner's chosen next learning. Correct answers never leave the server. */
export async function getChosenNextLesson(userId: string, lessonId: number): Promise<NextLesson | null> {
  const choice = await getNextLearning(userId);
  if (choice?.kind !== "lesson" || choice.lessonId !== lessonId) return null;
  const [lesson] = await db.select({ id: s.lessons.id, title: s.lessons.title, audioUrl: s.lessons.audioUrl, notesContent: s.lessons.notesContent })
    .from(s.lessons).where(eq(s.lessons.id, lessonId)).limit(1);
  if (!lesson) return null;
  const [[progress], questions, [best]] = await Promise.all([
    db.select().from(s.studentProgress).where(and(eq(s.studentProgress.userId, userId), eq(s.studentProgress.lessonId, lessonId))).limit(1),
    db.select({ id: s.quizQuestions.id, questionType: s.quizQuestions.questionType, questionText: s.quizQuestions.questionText, options: s.quizQuestions.options })
      .from(s.quizQuestions).where(eq(s.quizQuestions.lessonId, lessonId)).orderBy(asc(s.quizQuestions.sortOrder)),
    db.select({ score: sql<number | null>`max(${s.quizAttempts.score})` }).from(s.quizAttempts)
      .where(and(eq(s.quizAttempts.userId, userId), eq(s.quizAttempts.lessonId, lessonId))),
  ]);
  return {
    ...lesson,
    progress: { audioListened: progress?.audioListened ?? false, notesRead: progress?.notesRead ?? false, quizPassed: progress?.quizPassed ?? false },
    bestScore: best?.score ?? null,
    questions: questions.map(question => ({ ...question, options: (question.options as string[] | null) ?? null })),
  };
}
