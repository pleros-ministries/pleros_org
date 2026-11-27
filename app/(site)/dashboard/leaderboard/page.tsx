import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { setLeaderboardAliasAction, setLeaderboardHiddenAction } from "@/app/_actions/leaderboard-actions";
import { MonthlyLeaderboard } from "@/components/dashboard/leaderboard/monthly-leaderboard";
import { getAppSession } from "@/lib/app-session";
import { getMonthlyLeaderboard } from "@/lib/db/queries/monthly-leaderboard";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Leaderboard" };

/** One board for everyone, for the calendar month (Pastor, 25 November 2026). */
export default async function LeaderboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/leaderboard");
  const data = await getMonthlyLeaderboard(session.user.id);
  return <MonthlyLeaderboard data={data} saveHidden={setLeaderboardHiddenAction} saveAlias={setLeaderboardAliasAction} />;
}
