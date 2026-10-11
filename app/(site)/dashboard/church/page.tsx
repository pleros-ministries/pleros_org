import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardListIcon } from "lucide-react";
import { getAppSession } from "@/lib/app-session";
import { CHURCH_ROLE_LABELS, canManageChurchAssignments, type ChurchRole } from "@/lib/church/permissions";
import { churchOrganisationEnabled, churchMultiBranchEnabled, getChurchAssignment, getChurchStructure } from "@/lib/db/queries/church-organisation";
import { getChurchRosterDay } from "@/lib/db/queries/church-reports";
import { lagosToday } from "@/lib/sogp/daily-date";
import { AssignmentControls } from "@/components/dashboard/church/assignment-controls";
import { compactButton, focusRing } from "@/components/dashboard/shell/styles";

export default async function ChurchOversightPage({ searchParams }: { searchParams: Promise<{ supervisor?: string }> }) {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/church");
  const viewer = await getChurchAssignment(session.user.id);
  const bootstrap = session.user.role === "super_admin";
  if (!viewer && !bootstrap) redirect("/dashboard");
  const [roster, structure, params] = await Promise.all([getChurchRosterDay(session.user.id, lagosToday()), getChurchStructure(session.user.id, bootstrap), searchParams]);
  const scoped = params.supervisor ? roster.find((row) => row.userId === params.supervisor) : null;
  const rows = roster.filter((row) => row.userId !== session.user.id && (!scoped || row.supervisorId === scoped.userId));
  const groups = new Map<string, typeof rows>();
  for (const row of rows) { const label = row.unitName ?? row.branchName ?? "Direct reports"; groups.set(label, [...(groups.get(label) ?? []), row]); }
  return <div className="mx-auto grid max-w-4xl gap-6 p-4 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="font-medium">{scoped ? `${scoped.name}'s direct reports` : "Church oversight"}</h1>{scoped ? <Link href="/dashboard/church" className={compactButton}>All reports</Link> : null}</header>
    {!churchOrganisationEnabled() ? <p className="text-[13px] text-(--color-text-muted)">Church assignments will appear here after setup is enabled.</p> : rows.length === 0 ? <p className="text-[13px] text-(--color-text-muted)">No direct reports assigned.</p> : [...groups.entries()].map(([label, members]) => <section key={label} className="grid gap-2"><h2 className="font-medium">{label} <span className="inline-grid size-5 place-items-center rounded-full bg-(--color-brand-sky) text-[11px]">{members.length}</span></h2><ul className="divide-y divide-(--color-line) overflow-hidden rounded-xl border border-(--color-line)">{members.map((row) => <li key={row.userId} className="flex items-center gap-3 p-3"><Link href={row.role === "worker" ? `/dashboard/church/${encodeURIComponent(row.userId)}` : `/dashboard/church?supervisor=${encodeURIComponent(row.userId)}`} className={`grid min-w-0 flex-1 gap-0.5 rounded-sm ${focusRing}`}><span className="text-[14px] font-medium">{row.name}</span><span className="text-[12px] text-(--color-text-muted)">{CHURCH_ROLE_LABELS[row.role as ChurchRole]}</span></Link><span className="shrink-0 text-[12px] text-(--color-text-muted)">{Object.values(row.statuses).filter((status) => status !== "missing").length} of 3</span><Link href={`/dashboard/church/${encodeURIComponent(row.userId)}`} aria-label={`View ${row.name}'s report`} className={`${compactButton} w-8 px-0`}><ClipboardListIcon className="size-4" aria-hidden /></Link></li>)}</ul></section>)}
    {churchOrganisationEnabled() && (canManageChurchAssignments(viewer) || bootstrap && !viewer) ? <AssignmentControls multiBranch={churchMultiBranchEnabled()} viewer={viewer} bootstrap={bootstrap} branches={structure.branches} units={structure.units} roster={roster} /> : null}
  </div>;
}
