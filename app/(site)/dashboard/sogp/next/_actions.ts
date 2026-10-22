"use server";

import { revalidatePath } from "next/cache";

import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getAppSession } from "@/lib/app-session";
import { getLearningHubData } from "@/lib/dashboard/learning-hub";
import { markLessonAudioListened, markLessonNotesRead } from "@/lib/db/queries/lesson-progress";
import { chooseNextLesson, chooseNextPodcast, getNextLearning, getNextLessonOptions, saveOwnJourney } from "@/lib/db/queries/next-learning";
import { getAttemptCount, getQuizQuestions, submitQuizAttempt } from "@/lib/db/queries/quizzes";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { buildFoundationsPlan, buildPodcastSeriesCatalogue, PODCAST_FOUNDATIONS_TRACK, PODCAST_OWN_MAX, podcastSeriesTrack } from "@/lib/podcast-journey";
import { dedupeEpisodes } from "@/lib/podcast-episode-search";
import { canSubmitQuizAnswers } from "@/lib/student-journey";

/**
 * Choosing what comes after SOGP (Pastor, 21 October). Expected failures are
 * returned, not thrown: thrown messages are hidden in production.
 */
export type NextLearningResult = { ok: true } | { ok: false; error: string };
export type NextLearningPick = { kind: "foundations" } | { kind: "series"; seriesId: string } | { kind: "lesson"; lessonId: number };

const SIGNED_OUT = "Log in to continue.";
const NOT_YET = "You can choose what’s next once you’ve finished SOGP.";
const FAILED = "Couldn’t save that. Check your connection and try again.";

/** Only someone who has finished SOGP, or whose cohort has ended, chooses what's next. */
async function chooser() {
  const session = await getAppSession();
  if (!session) return { error: SIGNED_OUT } as const;
  const userId: string = session.user.id;
  const view = await getOwnLearningView(userId);
  const hub = view ? await getLearningHubData(userId, view.state) : null;
  if (!hub?.next.canChoose) return { error: NOT_YET } as const;
  return { userId, error: undefined } as const;
}

function refresh() {
  revalidatePath("/dashboard/sogp");
  revalidatePath("/dashboard/sogp/school");
  revalidatePath("/dashboard/podcast");
}

export async function chooseNextLearningAction(pick: NextLearningPick): Promise<NextLearningResult> {
  const who = await chooser();
  if (who.error !== undefined) return { ok: false, error: who.error };
  try {
    if (pick?.kind === "lesson") {
      if (!(await getNextLessonOptions()).some(option => option.id === pick.lessonId)) return { ok: false, error: "That teaching isn’t available right now. Choose another one." };
      await chooseNextLesson(who.userId, pick.lessonId);
    } else {
      const catalogue = buildPodcastSeriesCatalogue(await fetchAnchorEpisodes());
      const track = pick?.kind === "series" && catalogue.some(series => series.id === pick.seriesId && series.episodes.length) ? podcastSeriesTrack(pick.seriesId)
        : pick?.kind === "foundations" && buildFoundationsPlan(catalogue).length ? PODCAST_FOUNDATIONS_TRACK : null;
      if (!track) return { ok: false, error: "That journey isn’t available right now. Choose another one." };
      await chooseNextPodcast(who.userId, track);
    }
  } catch (error) {
    console.error("Next learning choice failed:", error);
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}

/** Saves the episodes picked for your own journey, in order, and starts it at Day 1 today. */
export async function saveOwnJourneyAction(guids: string[]): Promise<NextLearningResult> {
  const who = await chooser();
  if (who.error !== undefined) return { ok: false, error: who.error };
  if (!Array.isArray(guids) || !guids.length) return { ok: false, error: "Add at least one episode." };
  if (guids.length > PODCAST_OWN_MAX) return { ok: false, error: `Your journey can hold up to ${PODCAST_OWN_MAX} episodes.` };
  try {
    const available = new Set(dedupeEpisodes(await fetchAnchorEpisodes()).map(episode => episode.guid));
    const kept = guids.filter(guid => typeof guid === "string" && available.has(guid));
    if (kept.length !== guids.length) return { ok: false, error: "Some of those episodes aren’t available any more. Reload and try again." };
    await saveOwnJourney(who.userId, kept);
  } catch (error) {
    console.error("Own podcast journey failed:", error);
    return { ok: false, error: FAILED };
  }
  refresh();
  return { ok: true };
}

/** Steps of the chosen teaching; only that teaching, while it is the learner's next learning. */
async function lessonOwner(lessonId: number) {
  const session = await getAppSession();
  if (!session) return null;
  const choice = await getNextLearning(session.user.id);
  return choice?.kind === "lesson" && choice.lessonId === lessonId ? session.user.id : null;
}

export async function markNextLessonStepAction(lessonId: number, step: "audio" | "notes", done: boolean): Promise<NextLearningResult> {
  const userId = await lessonOwner(lessonId);
  if (!userId) return { ok: false, error: "This teaching isn’t your current learning." };
  try {
    if (step === "audio") await markLessonAudioListened(userId, lessonId, done !== false);
    else await markLessonNotesRead(userId, lessonId, done !== false);
  } catch (error) {
    console.error("Next lesson progress failed:", error);
    return { ok: false, error: FAILED };
  }
  revalidatePath("/dashboard/sogp");
  return { ok: true };
}

export async function submitNextLessonQuizAction(lessonId: number, answers: Record<string, string>): Promise<{ ok: true; score: number; passed: boolean } | { ok: false; error: string }> {
  const userId = await lessonOwner(lessonId);
  if (!userId) return { ok: false, error: "This teaching isn’t your current learning." };
  try {
    const questions = await getQuizQuestions(lessonId);
    const given = answers && typeof answers === "object" ? answers : {};
    if (!canSubmitQuizAnswers(questions, given)) return { ok: false, error: "Answer every question before submitting." };
    const scored = questions.filter(question => question.questionType === "multiple_choice");
    const correct = scored.filter(question => given[String(question.id)] === question.correctAnswer).length;
    const score = scored.length ? Math.round((correct / scored.length) * 100) : 0;
    await submitQuizAttempt({ userId, lessonId, answers: given, score, attemptNumber: (await getAttemptCount(userId, lessonId)) + 1 });
    revalidatePath("/dashboard/sogp");
    return { ok: true, score, passed: score >= 70 };
  } catch (error) {
    console.error("Next lesson quiz failed:", error);
    return { ok: false, error: FAILED };
  }
}
