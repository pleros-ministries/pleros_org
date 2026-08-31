import { redirect } from "next/navigation";

import { PodcastProgressPage } from "@/components/dashboard/podcast-progress-page";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getAppSession } from "@/lib/app-session";
import { getPodcastEpisodeProgress } from "@/lib/db/queries/podcast-progress";

export default async function DashboardPodcastPage() {
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/podcast");
  }

  const [episodes, listenedEpisodeGuids] = await Promise.all([
    fetchAnchorEpisodes(),
    getPodcastEpisodeProgress(appSession.user.id),
  ]);

  return (
    <PodcastProgressPage
      episodes={episodes}
      listenedEpisodeGuids={listenedEpisodeGuids}
    />
  );
}
