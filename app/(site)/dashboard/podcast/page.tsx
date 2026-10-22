import { redirect } from "next/navigation";

import { PodcastProgressPage } from "@/components/dashboard/podcast-progress-page";
import { getAppSession } from "@/lib/app-session";
import { getOwnJourneyGuids } from "@/lib/db/queries/next-learning";
import { getPodcastJourney } from "@/lib/db/queries/podcast-journey";
import { getPodcastLeaderboard } from "@/lib/db/queries/podcast-leaderboard";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function DashboardPodcastPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/podcast");
  }

  const [journey, leaderboard, ownEpisodeGuids] = await Promise.all([
    getPodcastJourney(appSession.user.id),
    getPodcastLeaderboard(appSession.user.id),
    getOwnJourneyGuids(appSession.user.id).catch(() => []),
  ]);

  return (
    <PodcastProgressPage
      episodes={journey.episodes}
      listenedEpisodeGuids={journey.listenedEpisodeGuids}
      todayKey={journey.todayKey}
      initialDateKey={date}
      calendarStartKey={journey.calendarStartKey}
      calendarEndKey={journey.calendarEndKey}
      prayerDateKeys={journey.prayerDateKeys}
      listenerName={appSession.user.name}
      leaderboard={leaderboard}
      track={journey.track}
      startedOn={journey.startedOn}
      ownEpisodeGuids={ownEpisodeGuids}
    />
  );
}
