import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChurchOversight } from "@/components/dashboard/church/church-oversight";
import { OversightHeader } from "@/components/dashboard/church/oversight-nav";
import { getAppSession } from "@/lib/app-session";
import { canManageChurchAssignments } from "@/lib/church/permissions";
import { loadChurchReports } from "@/lib/dashboard/church-reports";
import { churchOrganisationEnabled, getChurchAssignment } from "@/lib/db/queries/church-organisation";

export const metadata: Metadata = { title: "Reports · Oversight" };

/** Oversight's Reports tab: who has reported today across the viewer's scope. */
export default async function OversightReportsPage({ searchParams }: { searchParams: Promise<{ supervisor?: string }> }) {
  const [session, params] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/reports");
  const viewer = await getChurchAssignment(session.user.id);
  if (!canManageChurchAssignments(viewer) || !churchOrganisationEnabled()) redirect("/dashboard/church/reports");
  const { props, scoped } = await loadChurchReports(session.user.id, viewer!.role, params.supervisor);
  return <>
    <ChurchOversight {...props} header={<OversightHeader sub={`${props.scope} · ${props.dayLabel}`} />} />
    {scoped ? <Link href="/dashboard/community/oversight/reports" className="mt-3 inline-flex text-[12.5px] font-medium text-[var(--color-community-blue)]">All reports</Link> : null}
  </>;
}
