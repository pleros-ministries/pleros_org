import { redirect } from "next/navigation";

import { SogpDashboardBoundary } from "@/components/sogp/sogp-dashboard-boundary";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";

export default async function SogpDashboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enrol");
  return <SogpDashboardBoundary />;
}
