import { eq, sql } from "drizzle-orm";

import { fetchAnchorEpisodes, type RssEpisode } from "@/lib/anchor-rss";
import { db } from "@/lib/db";
import {
  getPodcastCalendarWindow,
  getPodcastPreviousMonthStartKey,
  PODCAST_FOUNDATIONS_TRACK,
} from "@/lib/podcast-journey";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

import * as schema from "../schema";
import { getPodcastEpisodeProgress } from "./podcast-progress";
import { getMorningPrayerWatchDateKeys } from "./prayer-watch";

export type PodcastJourneyData = {
  todayKey: string;
  calendarStartKey: string;
  calendarEndKey: string;
  episodes: RssEpisode[];
  listenedEpisodeGuids: string[];
  prayerDateKeys: string[];
  /** The stored choice; `resolvePodcastJourney` decides what it shows. */
  track: string;
  startedOn: string;
};

export type PodcastJourneyRow = typeof schema.podcastJourneys.$inferSelect;

async function getUserJoinedAt(userId: string): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return row?.createdAt ?? null;
}

/**
 * Returns the listener's journey, starting the recommended Foundations plan
 * today on their first visit.
 */
export async function ensurePodcastJourney(
  userId: string,
  todayKey: string,
): Promise<PodcastJourneyRow> {
  const [created] = await db
    .insert(schema.podcastJourneys)
    .values({ userId, track: PODCAST_FOUNDATIONS_TRACK, startedOn: todayKey })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [existing] = await db
    .select()
    .from(schema.podcastJourneys)
    .where(eq(schema.podcastJourneys.userId, userId))
    .limit(1);
  if (!existing) throw new Error("Could not load the podcast journey.");
  return existing;
}

/** Starts `track` at Day 1 today; listened episodes are untouched. */
export async function setPodcastTrack(
  userId: string,
  track: string,
  todayKey: string,
) {
  await db
    .insert(schema.podcastJourneys)
    .values({ userId, track, startedOn: todayKey })
    .onConflictDoUpdate({
      target: schema.podcastJourneys.userId,
      set: { track, startedOn: todayKey, updatedAt: sql`now()` },
    });
}

export async function setPodcastLeaderboardVisible(
  userId: string,
  visible: boolean,
  todayKey: string,
) {
  await db
    .insert(schema.podcastJourneys)
    .values({
      userId,
      track: PODCAST_FOUNDATIONS_TRACK,
      startedOn: todayKey,
      leaderboardVisible: visible,
    })
    .onConflictDoUpdate({
      target: schema.podcastJourneys.userId,
      set: { leaderboardVisible: visible, updatedAt: sql`now()` },
    });
}

export async function getPodcastJourney(
  userId: string,
  now = new Date(),
): Promise<PodcastJourneyData> {
  const todayKey = toLagosDateKey(now);
  const journey = await ensurePodcastJourney(userId, todayKey);
  const previousMonthStartKey = getPodcastPreviousMonthStartKey(todayKey);
  const [episodes, listenedEpisodeGuids, prayerDateKeys, joinedAt] =
    await Promise.all([
      fetchAnchorEpisodes(),
      getPodcastEpisodeProgress(userId),
      // Read from the widest possible start so this month's Prayer Watch
      // total stays right even when the calendar opens later, and a journey
      // begun before last month still shows its catch-up days.
      getMorningPrayerWatchDateKeys(
        userId,
        journey.startedOn < previousMonthStartKey
          ? journey.startedOn
          : previousMonthStartKey,
        todayKey,
      ),
      getUserJoinedAt(userId),
    ]);
  const { startKey, endKey } = getPodcastCalendarWindow({
    todayKey,
    joinedKey: joinedAt ? toLagosDateKey(joinedAt) : null,
  });

  return {
    todayKey,
    calendarStartKey: startKey,
    calendarEndKey: endKey,
    episodes,
    listenedEpisodeGuids,
    prayerDateKeys,
    track: journey.track,
    startedOn: journey.startedOn,
  };
}
