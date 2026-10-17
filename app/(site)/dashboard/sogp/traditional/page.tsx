import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentsWithCohortByUserId } from "@/lib/db/queries/sogp";
import { SogpDashboardBoundary } from "@/components/sogp/sogp-dashboard-boundary";
export default async function TraditionalSogpPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/traditional");
  const rows = await getSogpEnrollmentsWithCohortByUserId(session.user.id);
  if (!rows.length) redirect("/sogp/enrol");
  return <SogpDashboardBoundary />;
}
