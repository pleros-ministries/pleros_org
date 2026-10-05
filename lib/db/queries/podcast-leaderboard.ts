import { and, eq, gte, inArray, lte, sql, type AnyColumn } from "drizzle-orm";

import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { firstNameOf } from "@/lib/community/visibility";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  getPodcastMonthStartKey,
  indexPodcastEpisodesByDay,
} from "@/lib/podcast-journey";
import {
  buildPodcastLeaderboard,
  type PodcastLeaderboardData,
  type PodcastLeaderboardListener,
} from "@/lib/podcast-leaderboard";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

const lagosDay = (column: AnyColumn) =>
  sql<string>`to_char(${column} at time zone 'Africa/Lagos', 'YYYY-MM-DD')`;

/**
 * This month's podcast leaderboard. Only the month's daily episodes score, so
 * marking an old series as listened in bulk cannot inflate a total, and a
 * listener joins the board by marking at least one of them.
 */
export async function getPodcastLeaderboard(
  userId: string,
  now = new Date(),
): Promise<PodcastLeaderboardData> {
  const todayKey = toLagosDateKey(now);
  const monthStartKey = getPodcastMonthStartKey(todayKey);
  const episodes = await fetchAnchorEpisodes();
  const monthGuids = [
    ...indexPodcastEpisodesByDay(episodes, monthStartKey, todayKey).values(),
  ].map((episode) => episode.guid);

  if (monthGuids.length === 0) {
    return buildPodcastLeaderboard({ listeners: [], viewerId: userId, todayKey });
  }

  const monthListeners = db
    .select({ userId: schema.podcastEpisodeProgress.userId })
    .from(schema.podcastEpisodeProgress)
    .where(inArray(schema.podcastEpisodeProgress.episodeGuid, monthGuids));

  const [listens, prayerRows, nameRows] = await Promise.all([
    db
      .select({
        userId: schema.podcastEpisodeProgress.userId,
        day: lagosDay(schema.podcastEpisodeProgress.listenedAt),
      })
      .from(schema.podcastEpisodeProgress)
      .where(inArray(schema.podcastEpisodeProgress.episodeGuid, monthGuids)),
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        day: schema.prayerWatchAttendance.attendedDate,
      })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          inArray(schema.prayerWatchAttendance.userId, monthListeners),
          eq(schema.prayerWatchAttendance.session, "morning"),
          gte(schema.prayerWatchAttendance.attendedDate, monthStartKey),
          lte(schema.prayerWatchAttendance.attendedDate, todayKey),
        ),
      ),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(inArray(schema.users.id, monthListeners)),
  ]);

  const listeners = new Map<
    string,
    PodcastLeaderboardListener & { activityDays: Set<string> }
  >();
  for (const row of nameRows) {
    listeners.set(row.id, {
      userId: row.id,
      // Peers only ever see a first name.
      name: firstNameOf(row.name),
      episodes: 0,
      prayerWatch: 0,
      activityDays: new Set(),
    });
  }

  for (const row of listens) {
    const listener = listeners.get(row.userId);
    if (!listener) continue;
    listener.episodes += 1;
    if (row.day >= monthStartKey && row.day <= todayKey) {
      listener.activityDays.add(row.day);
    }
  }
  for (const row of prayerRows) {
    const listener = listeners.get(row.userId);
    if (!listener) continue;
    listener.prayerWatch += 1;
    listener.activityDays.add(row.day);
  }

  return buildPodcastLeaderboard({
    listeners: [...listeners.values()],
    viewerId: userId,
    todayKey,
  });
}
