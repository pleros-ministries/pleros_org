import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function SogpCoursePage() {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enrol");
  const dashboard = await getSogpDashboardData(session.user.id);
  const next = dashboard?.tracks.find((track) => !track.completed);
  redirect(next ? `/dashboard/sogp/course/day/${next.dayNumber}` : "/dashboard/sogp");
}
