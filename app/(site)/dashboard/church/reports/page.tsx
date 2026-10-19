import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { churchMultiBranchEnabled, getChurchAssignment, getChurchRoster, getChurchStructure } from "@/lib/db/queries/church-organisation";
import { AssignmentControls } from "@/components/dashboard/church/assignment-controls";

// Reads the session on every request (Cache Components).
export const instant = false;

/**
 * First-time Pastor setup for a super admin, before any Pastor exists. Church
 * reports are retired (groups as oversight, 19 October): everyone else goes to
 * Oversight.
 */
export default async function ChurchSetupPage() {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/church/reports");
  const viewer = await getChurchAssignment(session.user.id);
  if (viewer || session.user.role !== "super_admin") redirect("/dashboard/community/oversight");
  const [structure, roster] = await Promise.all([getChurchStructure(session.user.id, true), getChurchRoster(session.user.id)]);
  return <div className="mx-auto w-full max-w-140 px-4"><AssignmentControls multiBranch={churchMultiBranchEnabled()} viewer={viewer} bootstrap branches={structure.branches} units={structure.units} roster={roster} /></div>;
}
