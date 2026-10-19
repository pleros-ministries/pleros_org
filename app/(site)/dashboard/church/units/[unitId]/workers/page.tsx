import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { AddWorkers } from "@/components/dashboard/church/church-flows";
import { listWorkerMoveTargets } from "@/lib/db/queries/church-organisation";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function AddWorkersPage({ params }: { params: Promise<{ unitId: string }> }) {
  // Groups as oversight retires units, workers and the church pages (19 October).
  if (groupOversightEnabled()) redirect("/dashboard/community/oversight");
  const { unitId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/units/${unitId}/workers`);
  const place = await getChurchPlace(session.user.id, { unitId: Number(unitId) });
  if (!place?.unit) notFound();
  // Pastors and Branch Pastors can also move or remove workers (user request, 19 October).
  const moveTargets = place.viewerRole === "unit_leader" ? [] : await listWorkerMoveTargets(session.user.id);
  return <AddWorkers place={place} moveTargets={moveTargets} />;
}
