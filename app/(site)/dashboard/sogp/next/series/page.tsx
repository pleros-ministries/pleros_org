import type { Metadata } from "next";

import styles from "@/components/sogp/learning/learning-hub.module.css";
import { SeriesPicker } from "@/components/sogp/next-learning/episode-pickers";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getNextLearning } from "@/lib/db/queries/next-learning";
import { ensurePodcastJourney } from "@/lib/db/queries/podcast-journey";
import { getPodcastEpisodeProgress } from "@/lib/db/queries/podcast-progress";
import { buildPodcastSeriesCatalogue, podcastSeriesTrack } from "@/lib/podcast-journey";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

import { requireNextLearningChooser } from "../gate";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Choose a series" };

export default async function NextSeriesPage() {
  const { userId } = await requireNextLearningChooser("/dashboard/sogp/next/series");
  const [episodes, listened, choice] = await Promise.all([fetchAnchorEpisodes(), getPodcastEpisodeProgress(userId), getNextLearning(userId).catch(() => null)]);
  const track = choice?.kind === "podcast" ? (await ensurePodcastJourney(userId, toLagosDateKey(new Date()))).track : null;
  const heard = new Set(listened);
  const series = buildPodcastSeriesCatalogue(episodes).filter(item => item.episodes.length).map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    episodes: item.episodes.length,
    listened: item.episodes.filter(episode => heard.has(episode.guid)).length,
    current: track === podcastSeriesTrack(item.id),
  }));
  return <div className={styles.page}><div className={styles.column}><SeriesPicker series={series} /></div></div>;
}
