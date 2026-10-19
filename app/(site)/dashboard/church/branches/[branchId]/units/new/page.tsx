import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { CreatePlace } from "@/components/dashboard/church/church-flows";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function AddUnitPage({ params }: { params: Promise<{ branchId: string }> }) {
  // Groups as oversight retires units, workers and the church pages (19 October).
  if (groupOversightEnabled()) redirect("/dashboard/community/oversight");
  const { branchId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/branches/${branchId}/units/new`);
  const place = await getChurchPlace(session.user.id, { branchId: Number(branchId) });
  if (!place) notFound();
  return <CreatePlace branch={place.branch} />;
}
