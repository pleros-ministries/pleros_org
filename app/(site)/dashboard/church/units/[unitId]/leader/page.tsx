import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { AppointLeader } from "@/components/dashboard/church/church-flows";
import { listWorkerMoveTargets } from "@/lib/db/queries/church-organisation";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function AppointUnitLeaderPage({ params }: { params: Promise<{ unitId: string }> }) {
  // Groups as oversight retires units, workers and the church pages (19 October).
  if (groupOversightEnabled()) redirect("/dashboard/community/oversight");
  const { unitId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/units/${unitId}/leader`);
  const place = await getChurchPlace(session.user.id, { unitId: Number(unitId) });
  if (!place?.unit) notFound();
  // A unit leader reports to a branch pastor of that branch (validChurchParent).
  const supervisorId = place.viewerRole === "branch_pastor" ? place.viewerId : place.pastors[0]?.userId ?? null;
  // Changing a leader asks where the old leader goes (user request, 19 October).
  const moveTargets = place.unit.leader && place.viewerRole !== "unit_leader" ? await listWorkerMoveTargets(session.user.id) : [];
  return <AppointLeader place={place} role="unit_leader" supervisorId={supervisorId} moveTargets={moveTargets} />;
}
