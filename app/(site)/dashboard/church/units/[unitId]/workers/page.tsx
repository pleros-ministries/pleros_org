import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { AddWorkers } from "@/components/dashboard/church/church-flows";

export default async function AddWorkersPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/units/${unitId}/workers`);
  const place = await getChurchPlace(session.user.id, { unitId: Number(unitId) });
  if (!place?.unit) notFound();
  return <AddWorkers place={place} />;
}
