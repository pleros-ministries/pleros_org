import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { AppointLeader } from "@/components/dashboard/church/church-flows";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function AppointBranchPastorPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/branches/${branchId}/pastor`);
  const place = await getChurchPlace(session.user.id, { branchId: Number(branchId) });
  if (!place || place.viewerRole !== "pastor") notFound();
  return <AppointLeader place={place} role="branch_pastor" supervisorId={place.viewerId} unitsRetired={groupOversightEnabled()} />;
}
