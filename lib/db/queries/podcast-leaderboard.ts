import { and, eq, gte, inArray, lt, lte, or, sql, type AnyColumn } from "drizzle-orm";

import { firstNameOf } from "@/lib/community/visibility";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getPodcastMonthStartKey } from "@/lib/podcast-journey";
import {
  buildPodcastLeaderboard,
  type PodcastLeaderboardData,
  type PodcastLeaderboardListener,
} from "@/lib/podcast-leaderboard";
import { lagosRange } from "@/lib/sogp/daily-participation";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

const lagosDay = (column: AnyColumn) =>
  sql<string>`to_char(${column} at time zone 'Africa/Lagos', 'YYYY-MM-DD')`;

/**
 * This month's podcast leaderboard. A listener scores once for each Lagos day
 * they mark an episode, from any journey, plus the morning Prayer Watch. Only
 * listeners who chose to appear are read, plus the viewer for their own
 * private standing.
 */
export async function getPodcastLeaderboard(
  userId: string,
  now = new Date(),
): Promise<PodcastLeaderboardData> {
  const todayKey = toLagosDateKey(now);
  const monthStartKey = getPodcastMonthStartKey(todayKey);
  const month = lagosRange(monthStartKey, todayKey);
  const progress = schema.podcastEpisodeProgress;

  const visibleListeners = db
    .select({ userId: schema.podcastJourneys.userId })
    .from(schema.podcastJourneys)
    .where(eq(schema.podcastJourneys.leaderboardVisible, true));

  const [listens, viewerRows] = await Promise.all([
    db
      .selectDistinct({ userId: progress.userId, day: lagosDay(progress.listenedAt) })
      .from(progress)
      .where(
        and(
          gte(progress.listenedAt, month.start),
          lt(progress.listenedAt, month.end),
          or(eq(progress.userId, userId), inArray(progress.userId, visibleListeners)),
        ),
      ),
    db
      .select({ visible: schema.podcastJourneys.leaderboardVisible })
      .from(schema.podcastJourneys)
      .where(eq(schema.podcastJourneys.userId, userId))
      .limit(1),
  ]);
  const viewerVisible = viewerRows[0]?.visible ?? false;
  const listenerIds = [...new Set(listens.map((row) => row.userId))];

  if (listenerIds.length === 0) {
    return buildPodcastLeaderboard({
      listeners: [],
      viewerId: userId,
      viewerVisible,
      todayKey,
    });
  }

  const [prayerRows, nameRows] = await Promise.all([
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        day: schema.prayerWatchAttendance.attendedDate,
      })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          inArray(schema.prayerWatchAttendance.userId, listenerIds),
          eq(schema.prayerWatchAttendance.session, "morning"),
          gte(schema.prayerWatchAttendance.attendedDate, monthStartKey),
          lte(schema.prayerWatchAttendance.attendedDate, todayKey),
        ),
      ),
    db
      .select({ id: schema.users.id, name: schema.users.name })
      .from(schema.users)
      .where(inArray(schema.users.id, listenerIds)),
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
      listeningDays: 0,
      prayerWatch: 0,
      activityDays: new Set(),
      // Everyone read here opted in, except possibly the viewer.
      visible: row.id === userId ? viewerVisible : true,
    });
  }

  for (const row of listens) {
    const listener = listeners.get(row.userId);
    if (!listener) continue;
    listener.listeningDays += 1;
    listener.activityDays.add(row.day);
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
    viewerVisible,
    todayKey,
  });
}
