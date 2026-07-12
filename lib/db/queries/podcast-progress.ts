import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

export async function getPodcastEpisodeProgress(userId: string): Promise<string[]> {
  const rows = await db
    .select({ episodeGuid: schema.podcastEpisodeProgress.episodeGuid })
    .from(schema.podcastEpisodeProgress)
    .where(eq(schema.podcastEpisodeProgress.userId, userId));

  return rows.map((row) => row.episodeGuid);
}

export async function markPodcastEpisodeListened(userId: string, episodeGuid: string) {
  const [row] = await db
    .insert(schema.podcastEpisodeProgress)
    .values({ userId, episodeGuid, listenedAt: new Date(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [
        schema.podcastEpisodeProgress.userId,
        schema.podcastEpisodeProgress.episodeGuid,
      ],
      set: {
        listenedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  return row ?? null;
}

export async function markPodcastEpisodesListened(
  userId: string,
  episodeGuids: string[],
) {
  const uniqueGuids = [...new Set(episodeGuids.map((guid) => guid.trim()).filter(Boolean))];

  await Promise.all(
    uniqueGuids.map((episodeGuid) =>
      markPodcastEpisodeListened(userId, episodeGuid),
    ),
  );
}

export async function removePodcastEpisodeProgress(
  userId: string,
  episodeGuid: string,
) {
  await db
    .delete(schema.podcastEpisodeProgress)
    .where(
      and(
        eq(schema.podcastEpisodeProgress.userId, userId),
        eq(schema.podcastEpisodeProgress.episodeGuid, episodeGuid),
      ),
    );
}
