import { redirect } from "next/navigation";

import { PodcastProgressPage } from "@/components/dashboard/podcast-progress-page";
import { getAppSession } from "@/lib/app-session";
import { getPodcastJourney } from "@/lib/db/queries/podcast-journey";
import { getPodcastLeaderboard } from "@/lib/db/queries/podcast-leaderboard";

export default async function DashboardPodcastPage() {
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/podcast");
  }

  const [journey, leaderboard] = await Promise.all([
    getPodcastJourney(appSession.user.id),
    getPodcastLeaderboard(appSession.user.id),
  ]);

  return (
    <PodcastProgressPage
      episodes={journey.episodes}
      listenedEpisodeGuids={journey.listenedEpisodeGuids}
      todayKey={journey.todayKey}
      calendarStartKey={journey.calendarStartKey}
      calendarEndKey={journey.calendarEndKey}
      prayerDateKeys={journey.prayerDateKeys}
      listenerName={appSession.user.name}
      leaderboard={leaderboard}
    />
  );
}
