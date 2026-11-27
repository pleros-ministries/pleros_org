import { redirect } from "next/navigation";

/** The cohort board became the one monthly board (Pastor, 25 November 2026). */
export default function SogpLeaderboardPage() {
  redirect("/dashboard/leaderboard");
}
