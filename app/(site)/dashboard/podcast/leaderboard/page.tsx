import { redirect } from "next/navigation";

/** The podcast board became the one monthly board (Pastor, 25 November 2026). */
export default function PodcastLeaderboardPage() {
  redirect("/dashboard/leaderboard");
}
