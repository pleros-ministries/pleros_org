import { redirect } from "next/navigation";

import { SogpDashboardBoundary } from "@/components/sogp/sogp-dashboard-boundary";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";

export default async function SogpDashboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enroll");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enroll");
  return <SogpDashboardBoundary />;
}
