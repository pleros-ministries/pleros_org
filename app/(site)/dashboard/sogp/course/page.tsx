import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";

export default async function SogpCoursePage() {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enroll");
  const dashboard = await getSogpDashboardData(session.user.id);
  const next = dashboard?.tracks.find((track) => !track.completed);
  redirect(next ? `/dashboard/sogp/course/day/${next.dayNumber}` : "/dashboard/sogp");
}
