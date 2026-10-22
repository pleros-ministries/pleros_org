import type { Metadata } from "next";

import styles from "@/components/sogp/learning/learning-hub.module.css";
import { OwnJourneyBuilder } from "@/components/sogp/next-learning/episode-pickers";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getOwnJourneyGuids } from "@/lib/db/queries/next-learning";
import { PODCAST_OWN_MAX } from "@/lib/podcast-journey";

import { requireNextLearningChooser } from "../gate";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Your own journey" };

/** Your own podcast journey (user, 21 October): episodes you pick, one a day in your order. */
export default async function OwnJourneyPage() {
  const { userId } = await requireNextLearningChooser("/dashboard/sogp/next/own");
  const [episodes, initial] = await Promise.all([fetchAnchorEpisodes(), getOwnJourneyGuids(userId).catch(() => [])]);
  // Newest first, so recent teachings are at hand before any search.
  const list = [...episodes].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .map(episode => ({ guid: episode.guid, title: episode.title, duration: episode.duration }));
  return <div className={styles.page}><div className={styles.column}><OwnJourneyBuilder episodes={list} initial={initial} max={PODCAST_OWN_MAX} /></div></div>;
}
