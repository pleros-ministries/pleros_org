import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { AppointLeader } from "@/components/dashboard/church/church-flows";

export default async function AppointUnitLeaderPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/units/${unitId}/leader`);
  const place = await getChurchPlace(session.user.id, { unitId: Number(unitId) });
  if (!place?.unit) notFound();
  // A unit leader reports to a branch pastor of that branch (validChurchParent).
  const supervisorId = place.viewerRole === "branch_pastor" ? place.viewerId : place.pastors[0]?.userId ?? null;
  return <AppointLeader place={place} role="unit_leader" supervisorId={supervisorId} />;
}
