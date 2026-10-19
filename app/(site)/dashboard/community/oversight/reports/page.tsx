import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChurchOversight } from "@/components/dashboard/church/church-oversight";
import { OversightHeader } from "@/components/dashboard/church/oversight-nav";
import { getAppSession } from "@/lib/app-session";
import { canManageChurchAssignments } from "@/lib/church/permissions";
import { dateKeyLabel } from "@/lib/community/time";
import { loadChurchReports } from "@/lib/dashboard/church-reports";
import { churchOrganisationEnabled, getChurchAssignment } from "@/lib/db/queries/church-organisation";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";
import { lagosToday } from "@/lib/sogp/daily-date";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Reports · Oversight" };

/** Oversight's Reports tab: who has reported today across the viewer's groups (or scope). */
export default async function OversightReportsPage({ searchParams }: { searchParams: Promise<{ supervisor?: string; under?: string }> }) {
  const [session, params] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/reports");
  if (groupOversightEnabled()) {
    const data = await getGroupOversight(session.user.id, { under: params.under });
    if (!data) redirect("/dashboard/community");
    const today = lagosToday();
    const rows = data.people.map(person => ({
      userId: person.userId,
      name: person.name,
      roleLabel: person.leadsMembers ? "Group leader" : "Member",
      group: person.groupName ? `${person.overseerName && person.depth !== 1 ? `${person.overseerName.split(" ")[0]}’s ` : ""}${person.groupName}` : "Leads a group",
      statuses: person.statuses,
    }));
    return <>
      <ChurchOversight rows={rows} day={today} dayLabel={dateKeyLabel(today)} scope={data.scopeLabel} remindersEnabled={reportRemindersEnabled()}
        note="People in your groups and the groups under them. Open someone to read their full report."
        header={<OversightHeader title={data.under ? data.under.name : "Oversight"} structure={data.role === "pastor" && !data.under} sub={`${data.scopeLabel} · ${dateKeyLabel(today)}`} />} />
      {data.under ? <Link href="/dashboard/community/oversight/reports" className="mt-3 inline-flex text-[12.5px] font-medium text-[var(--color-community-blue)]">All reports</Link> : null}
    </>;
  }
  const viewer = await getChurchAssignment(session.user.id);
  if (!canManageChurchAssignments(viewer) || !churchOrganisationEnabled()) redirect("/dashboard/church/reports");
  const { props, scoped } = await loadChurchReports(session.user.id, viewer!.role, params.supervisor);
  return <>
    <ChurchOversight {...props} header={<OversightHeader sub={`${props.scope} · ${props.dayLabel}`} />} />
    {scoped ? <Link href="/dashboard/community/oversight/reports" className="mt-3 inline-flex text-[12.5px] font-medium text-[var(--color-community-blue)]">All reports</Link> : null}
  </>;
}
