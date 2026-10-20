import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";
import { sogpLearningSchemaReady } from "./sogp-learning-gate";

function uniqueEpisodeGuids(episodeGuids: string[]) {
  return [...new Set(episodeGuids.map((guid) => guid.trim()).filter(Boolean))];
}

export async function getPodcastEpisodeProgress(userId: string): Promise<string[]> {
  const rows = await db
    .select({ episodeGuid: schema.podcastEpisodeProgress.episodeGuid })
    .from(schema.podcastEpisodeProgress)
    .where(eq(schema.podcastEpisodeProgress.userId, userId));

  return rows.map((row) => row.episodeGuid);
}

/**
 * Marking an episode that is already listened keeps its first `listened_at`,
 * so a bulk "Mark all as listened" cannot move earlier listening days on the
 * leaderboard or in the daily ministry report.
 */
export async function markPodcastEpisodeListened(userId: string, episodeGuid: string) {
  await markPodcastEpisodesListened(userId, [episodeGuid]);
}

export async function markPodcastEpisodesListened(
  userId: string,
  episodeGuids: string[],
) {
  const uniqueGuids = uniqueEpisodeGuids(episodeGuids);
  if (!uniqueGuids.length) return;

  if (sogpLearningSchemaReady()) {
    const { withSogpLearningLock, bumpSogpLearningRevision } = await import("../sogp-learning-lock");
    await withSogpLearningLock(userId, async tx => {
      const changed = await tx.insert(schema.podcastEpisodeProgress).values(uniqueGuids.map(episodeGuid => ({ userId,episodeGuid }))).onConflictDoNothing({ target: [schema.podcastEpisodeProgress.userId,schema.podcastEpisodeProgress.episodeGuid] }).returning({ guid: schema.podcastEpisodeProgress.episodeGuid });
      if (changed.length) await bumpSogpLearningRevision(tx,userId);
    });
    return;
  }

  await db
    .insert(schema.podcastEpisodeProgress)
    .values(uniqueGuids.map((episodeGuid) => ({ userId, episodeGuid })))
    .onConflictDoNothing({
      target: [
        schema.podcastEpisodeProgress.userId,
        schema.podcastEpisodeProgress.episodeGuid,
      ],
    });
}

export async function removePodcastEpisodesProgress(
  userId: string,
  episodeGuids: string[],
) {
  const uniqueGuids = uniqueEpisodeGuids(episodeGuids);
  if (!uniqueGuids.length) return;

  if (sogpLearningSchemaReady()) {
    const { withSogpLearningLock, bumpSogpLearningRevision } = await import("../sogp-learning-lock");
    await withSogpLearningLock(userId, async tx => {
      const changed = await tx.delete(schema.podcastEpisodeProgress).where(and(eq(schema.podcastEpisodeProgress.userId,userId),inArray(schema.podcastEpisodeProgress.episodeGuid,uniqueGuids))).returning({ guid: schema.podcastEpisodeProgress.episodeGuid });
      if (changed.length) await bumpSogpLearningRevision(tx,userId);
    });
    return;
  }

  await db
    .delete(schema.podcastEpisodeProgress)
    .where(
      and(
        eq(schema.podcastEpisodeProgress.userId, userId),
        inArray(schema.podcastEpisodeProgress.episodeGuid, uniqueGuids),
      ),
    );
}

export async function removePodcastEpisodeProgress(
  userId: string,
  episodeGuid: string,
) {
  await removePodcastEpisodesProgress(userId, [episodeGuid]);
}

export type ReportPodcastEpisode = { guid: string; title: string; isoDate: string; duration: string; listenedOn: string | null };

/**
 * Every podcast episode in release order with the day each was listened, for
 * picking the day's episodes when reporting Teaching (Pastor, 20 October).
 * `start` is where the list opens: just before the last episode listened.
 */
export async function listReportPodcastEpisodes(userId: string): Promise<{ episodes: ReportPodcastEpisode[]; start: number }> {
  const [{ fetchAnchorEpisodes }, { toLagosDateKey }] = await Promise.all([import("@/lib/anchor-rss"), import("@/lib/sogp/formation-progress")]);
  const [catalogue, rows] = await Promise.all([
    fetchAnchorEpisodes().catch(() => []),
    db.select({ guid: schema.podcastEpisodeProgress.episodeGuid, listenedAt: schema.podcastEpisodeProgress.listenedAt })
      .from(schema.podcastEpisodeProgress).where(eq(schema.podcastEpisodeProgress.userId, userId)),
  ]);
  const listened = new Map(rows.map(row => [row.guid, row.listenedAt]));
  const episodes = [...catalogue]
    .sort((a, b) => a.isoDate.localeCompare(b.isoDate) || (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
    .map(episode => {
      const at = listened.get(episode.guid);
      return { guid: episode.guid, title: episode.title, isoDate: episode.isoDate, duration: episode.duration, listenedOn: at ? toLagosDateKey(at) : null };
    });
  // The most recently listened episode, by when it was listened.
  let last = -1, lastAt = 0;
  episodes.forEach((episode, index) => { const at = listened.get(episode.guid)?.getTime() ?? 0; if (at > lastAt) { lastAt = at; last = index; } });
  return { episodes, start: Math.max(0, last - 1) };
}

/**
 * Records the episodes picked for a report day as listened on that day, and
 * clears ones unpicked if they were listened that same day. Episodes listened
 * on another day keep that day, as everywhere else.
 */
export async function setReportPodcastEpisodes(userId: string, dateKey: string, input: { add: string[]; remove: string[] }) {
  const add = uniqueEpisodeGuids(input.add).slice(0, 50);
  const remove = uniqueEpisodeGuids(input.remove).slice(0, 50);
  if (!add.length && !remove.length) return;
  const { lagosToday } = await import("@/lib/sogp/daily-date");
  const { toLagosDateKey } = await import("@/lib/sogp/formation-progress");
  // Today keeps the real time; an earlier day is recorded at midday Lagos.
  const listenedAt = dateKey === lagosToday() ? new Date() : new Date(`${dateKey}T12:00:00+01:00`);
  // The same queries run on the HTTP client or inside the learning lock's transaction.
  const apply = async (tx: typeof db) => {
    let changed = 0;
    if (add.length) changed += (await tx.insert(schema.podcastEpisodeProgress).values(add.map(episodeGuid => ({ userId, episodeGuid, listenedAt })))
      .onConflictDoNothing({ target: [schema.podcastEpisodeProgress.userId, schema.podcastEpisodeProgress.episodeGuid] }).returning({ id: schema.podcastEpisodeProgress.id })).length;
    if (remove.length) {
      const rows = await tx.select({ id: schema.podcastEpisodeProgress.id, listenedAt: schema.podcastEpisodeProgress.listenedAt }).from(schema.podcastEpisodeProgress)
        .where(and(eq(schema.podcastEpisodeProgress.userId, userId), inArray(schema.podcastEpisodeProgress.episodeGuid, remove)));
      const sameDay = rows.filter(row => toLagosDateKey(row.listenedAt) === dateKey).map(row => row.id);
      if (sameDay.length) changed += (await tx.delete(schema.podcastEpisodeProgress).where(inArray(schema.podcastEpisodeProgress.id, sameDay)).returning({ id: schema.podcastEpisodeProgress.id })).length;
    }
    return changed;
  };
  if (sogpLearningSchemaReady()) {
    const { withSogpLearningLock, bumpSogpLearningRevision } = await import("../sogp-learning-lock");
    await withSogpLearningLock(userId, async tx => { if (await apply(tx as unknown as typeof db)) await bumpSogpLearningRevision(tx, userId); });
    return;
  }
  await apply(db);
}
