import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChurchHomeView } from "@/components/dashboard/church/church-home";
import { OversightHeader } from "@/components/dashboard/church/oversight-nav";
import { getAppSession } from "@/lib/app-session";
import { canManageChurchAssignments } from "@/lib/church/permissions";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import { getChurchHome } from "@/lib/db/queries/church-home";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Structure · Oversight" };

/** Oversight's Structure tab: branches, units, leaders and member placement. */
export default async function OversightStructurePage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/structure");
  const [viewer, data] = await Promise.all([getChurchAssignment(session.user.id), getChurchHome(session.user.id)]);
  // Groups as oversight: Structure is the Pastor's branches and branch pastors only.
  const retired = groupOversightEnabled();
  if (retired && viewer?.role !== "pastor") redirect("/dashboard/community/oversight");
  if (!canManageChurchAssignments(viewer) || data.kind !== "structure") redirect("/dashboard/church");
  const sub = data.role === "pastor" ? "Fullness of Christ Church · all branches" : `Branch pastor · ${data.branches.length} ${data.branches.length === 1 ? "branch" : "branches"}`;
  return <ChurchHomeView data={data} canOversee={!retired} unitsRetired={retired} header={<OversightHeader sub={retired ? "Fullness of Christ Church · branches and branch pastors" : sub} />} />;
}
