import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { canManageChurchAssignments } from "@/lib/church/permissions";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { loadChurchReports } from "@/lib/dashboard/church-reports";
import { churchOrganisationEnabled, churchMultiBranchEnabled, getChurchAssignment, getChurchStructure } from "@/lib/db/queries/church-organisation";
import { AssignmentControls } from "@/components/dashboard/church/assignment-controls";
import { compactButton } from "@/components/dashboard/shell/styles";
import { ChurchOversight } from "@/components/dashboard/church/church-oversight";

// Reads the session on every request (Cache Components).
export const instant = false;

/**
 * Church reports for unit leaders and anyone else with direct reports. Pastors
 * and Branch Pastors with Community read them in Oversight's Reports tab; the
 * first-time super-admin setup controls stay here.
 */
export default async function ChurchOversightPage({ searchParams }: { searchParams: Promise<{ supervisor?: string }> }) {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/church/reports");
  const [viewer, params] = await Promise.all([getChurchAssignment(session.user.id), searchParams]);
  const bootstrap = session.user.role === "super_admin";
  if (!viewer && !bootstrap) redirect("/dashboard");
  if (canManageChurchAssignments(viewer)) {
    const ctx = await getCommunityContext();
    if (ctx && canAccessCommunity(ctx)) redirect(`/dashboard/community/oversight/reports${params.supervisor ? `?supervisor=${encodeURIComponent(params.supervisor)}` : ""}`);
  }
  const [{ props, roster, scoped }, structure] = await Promise.all([
    loadChurchReports(session.user.id, viewer?.role ?? null, params.supervisor),
    bootstrap && !viewer ? getChurchStructure(session.user.id, bootstrap) : Promise.resolve(null),
  ]);
  return <div className="grid gap-6">
    {churchOrganisationEnabled() ? <ChurchOversight {...props} /> : <p className="text-[13px] text-(--color-text-muted)">Church assignments will appear here after setup is enabled.</p>}
    {scoped ? <Link href="/dashboard/church/reports" className={`${compactButton} mx-auto`}>All reports</Link> : null}
    {churchOrganisationEnabled() && structure ? <div className="mx-auto w-full max-w-140 px-4"><AssignmentControls multiBranch={churchMultiBranchEnabled()} viewer={viewer} bootstrap={bootstrap} branches={structure.branches} units={structure.units} roster={roster} /></div> : null}
  </div>;
}
