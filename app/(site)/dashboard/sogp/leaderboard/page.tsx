import { redirect } from "next/navigation";

import { LeaderboardBoundary } from "@/components/sogp/leaderboard-boundary";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { getSogpLeaderboard } from "@/lib/db/queries/sogp-leaderboard";

export default async function SogpLeaderboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/leaderboard");

  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enrol");

  const initialData = await getSogpLeaderboard(session.user.id);
  if (!initialData) redirect("/sogp/enrol");

  return <LeaderboardBoundary initialData={initialData} />;
}
