import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentsWithCohortByUserId } from "@/lib/db/queries/sogp";
import { SogpDashboardBoundary } from "@/components/sogp/sogp-dashboard-boundary";
import Link from "next/link";
export default async function TraditionalSogpPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/traditional");
  const rows = await getSogpEnrollmentsWithCohortByUserId(session.user.id);
  if (!rows.length) redirect("/sogp/enrol");
  return <><div className="site-shell-page sogp-shell-page py-3"><Link className="inline-flex min-h-11 items-center text-sm text-(--color-brand-blue)" href="/dashboard/sogp">← Back to My SOGP</Link></div><SogpDashboardBoundary /></>;
}
