import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PodcastProgressPage } from "@/components/dashboard/podcast-progress-page";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getAppSession } from "@/lib/app-session";
import { getPodcastEpisodeProgress } from "@/lib/db/queries/podcast-progress";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardPodcastPage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!appSession && welcomeSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard%2Fpodcast");
  }

  if (!appSession) {
    redirect("/welcome");
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
