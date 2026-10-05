import { redirect } from "next/navigation";

import { PodcastLeaderboardPage } from "@/components/dashboard/podcast-leaderboard-page";
import { getAppSession } from "@/lib/app-session";
import { getPodcastLeaderboard } from "@/lib/db/queries/podcast-leaderboard";

export default async function DashboardPodcastLeaderboardPage() {
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/podcast/leaderboard");
  }

  const data = await getPodcastLeaderboard(appSession.user.id);

  return <PodcastLeaderboardPage data={data} />;
}
