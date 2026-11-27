import "server-only";
import { unstable_cache } from "next/cache";

import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getAllTeachings } from "@/lib/db/queries/teachings";
import { teachingKey } from "@/lib/sogp/learning-input";
import type { LearningEpisode } from "@/lib/sogp/learning-view";

/** "Understanding the Gospel - Mar. 17, 2021" → "Understanding the Gospel". */
export function teachingTitle(title: string) {
  return title.replace(/\s+[-–]\s+[A-Z][a-z]{2,4}\.?\s+\d{1,2},\s+\d{4}\s*$/, "").trim();
}
/** Seconds as "HH:MM:SS", the podcast feed's own duration format; "" when unknown. */
function clock(seconds: number | null) {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
  return [h, m, s].map(part => String(part).padStart(2, "0")).join(":");
}

/** The Teachings Library as learning items, in Library order. Shares the Library's 60s cache shape. */
export const getLibraryLearningItems = unstable_cache(
  async (): Promise<LearningEpisode[]> => (await getAllTeachings()).map(row => ({
    guid: teachingKey(row.id), title: teachingTitle(row.title), duration: clock(row.duration), audioUrl: row.audioUrl, series: row.series,
  })),
  ["learning-library-items"],
  { revalidate: 60 },
);

/**
 * Everything a learning plan can hold: podcast episodes and Library teachings
 * (doctrinal journey, migration 0079). Either source failing leaves the other.
 */
export async function getLearningCatalogue(): Promise<LearningEpisode[]> {
  const [episodes, teachings] = await Promise.all([
    fetchAnchorEpisodes().then(rows => rows.map(({ guid, title, duration, audioUrl }) => ({ guid, title, duration, audioUrl }))).catch(() => [] as LearningEpisode[]),
    getLibraryLearningItems().catch(() => [] as LearningEpisode[]),
  ]);
  return [...episodes, ...teachings];
}
