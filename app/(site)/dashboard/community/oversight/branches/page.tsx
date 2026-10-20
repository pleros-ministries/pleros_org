import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChurchStructureView } from "@/components/dashboard/church/church-home";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import { getChurchHome } from "@/lib/db/queries/church-home";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Branches · Oversight" };

/** The Pastor's branches, branch pastors and member placement, from Oversight's Structure. */
export default async function OversightBranchesPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/branches");
  const [viewer, data] = await Promise.all([getChurchAssignment(session.user.id), getChurchHome(session.user.id)]);
  if (viewer?.role !== "pastor" || data.kind !== "structure") redirect("/dashboard/community/oversight");
  return <ChurchStructureView branches={data.branches} />;
}
