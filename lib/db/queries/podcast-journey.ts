import { eq } from "drizzle-orm";

import { fetchAnchorEpisodes, type RssEpisode } from "@/lib/anchor-rss";
import { db } from "@/lib/db";
import {
  getPodcastCalendarWindow,
  getPodcastPreviousMonthStartKey,
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
};

async function getUserJoinedAt(userId: string): Promise<Date | null> {
  const [row] = await db
    .select({ createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return row?.createdAt ?? null;
}

export async function getPodcastJourney(
  userId: string,
  now = new Date(),
): Promise<PodcastJourneyData> {
  const todayKey = toLagosDateKey(now);
  const [episodes, listenedEpisodeGuids, prayerDateKeys, joinedAt] =
    await Promise.all([
      fetchAnchorEpisodes(),
      getPodcastEpisodeProgress(userId),
      // Read from the widest possible start so this month's Prayer Watch
      // total stays right even when the calendar opens later.
      getMorningPrayerWatchDateKeys(
        userId,
        getPodcastPreviousMonthStartKey(todayKey),
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
  };
}
