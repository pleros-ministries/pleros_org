import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChurchStructureView } from "@/components/dashboard/church/church-home";
import { OversightHeader } from "@/components/dashboard/church/oversight-nav";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import { getChurchHome } from "@/lib/db/queries/church-home";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Structure · Oversight" };

/** Oversight's Structure tab: the Pastor's branches, branch pastors and member placement. */
export default async function OversightStructurePage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/structure");
  const [viewer, data] = await Promise.all([getChurchAssignment(session.user.id), getChurchHome(session.user.id)]);
  if (viewer?.role !== "pastor" || data.kind !== "structure") redirect("/dashboard/community/oversight");
  return <ChurchStructureView branches={data.branches} header={<OversightHeader sub="Branches and branch pastors" />} />;
}
