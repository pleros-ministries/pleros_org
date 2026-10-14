import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { CHURCH_ROLE_LABELS, type ChurchRole } from "@/lib/church/permissions";
import { churchOrganisationEnabled, churchMultiBranchEnabled, getChurchAssignment, getChurchStructure } from "@/lib/db/queries/church-organisation";
import { getChurchRosterDay } from "@/lib/db/queries/church-reports";
import { lagosToday } from "@/lib/sogp/daily-date";
import { AssignmentControls } from "@/components/dashboard/church/assignment-controls";
import { compactButton } from "@/components/dashboard/shell/styles";
import { ChurchOversight } from "@/components/dashboard/church/church-oversight";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { dateKeyLabel } from "@/lib/community/time";

export default async function ChurchOversightPage({ searchParams }: { searchParams: Promise<{ supervisor?: string }> }) {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/church/reports");
  const viewer = await getChurchAssignment(session.user.id);
  const bootstrap = session.user.role === "super_admin";
  if (!viewer && !bootstrap) redirect("/dashboard");
  const [roster, structure, params] = await Promise.all([getChurchRosterDay(session.user.id, lagosToday()), getChurchStructure(session.user.id, bootstrap), searchParams]);
  const scoped = params.supervisor ? roster.find((row) => row.userId === params.supervisor) : null;
  const rows = roster.filter((row) => row.userId !== session.user.id && (!scoped || row.supervisorId === scoped.userId));
  const scopeLabel = scoped ? `${scoped.name}’s direct reports` : viewer?.role === "pastor" ? "All branches" : viewer?.role === "unit_leader" ? "Your unit" : rows[0]?.branchName ? `${rows[0].branchName} branch` : "Your oversight";
  const today = lagosToday();
  return <div className="grid gap-6">
    {churchOrganisationEnabled() ? <ChurchOversight day={today} dayLabel={dateKeyLabel(today)} scope={scopeLabel} remindersEnabled={reportRemindersEnabled()}
      rows={rows.map(row => ({ userId: row.userId, name: row.name, roleLabel: CHURCH_ROLE_LABELS[row.role as ChurchRole], group: row.unitName ?? row.branchName ?? "Direct report", statuses: row.statuses }))} /> : <p className="text-[13px] text-(--color-text-muted)">Church assignments will appear here after setup is enabled.</p>}
    {scoped ? <Link href="/dashboard/church/reports" className={`${compactButton} mx-auto`}>All reports</Link> : null}
    {churchOrganisationEnabled() && bootstrap && !viewer ? <div className="mx-auto w-full max-w-140 px-4"><AssignmentControls multiBranch={churchMultiBranchEnabled()} viewer={viewer} bootstrap={bootstrap} branches={structure.branches} units={structure.units} roster={roster} /></div> : null}
  </div>;
}
