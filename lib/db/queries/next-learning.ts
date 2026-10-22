import "server-only";

import { asc, eq, sql } from "drizzle-orm";

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
 * learning on Learning: a podcast journey (the Foundations plan, a Library
 * series or episodes they pick). Separate teachings aren't offered (user,
 * 22 October); the table's `lesson` kind stays unused.
 */

export type NextLearningChoice = { kind: "podcast" };

/** Postgres "relation does not exist": migration 0076 isn't applied yet. */
function missingTable(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

export async function getNextLearning(userId: string): Promise<NextLearningChoice | null> {
  try {
    const [row] = await db.select({ kind: s.nextLearning.kind }).from(s.nextLearning).where(eq(s.nextLearning.userId, userId)).limit(1);
    return row?.kind === "podcast" ? { kind: "podcast" } : null;
  } catch (error) {
    if (missingTable(error)) return null;
    throw error;
  }
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

export type NextLearningCard = { kind: "podcast"; title: string; dayNumber: number; totalDays: number; listened: number; finished: boolean; episodeTitle: string | null; todayListened: boolean };

/** What Learning shows for the chosen next learning. */
export async function getNextLearningCard(userId: string): Promise<NextLearningCard | null> {
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
