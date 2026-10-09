import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

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
