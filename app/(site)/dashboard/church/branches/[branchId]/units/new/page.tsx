import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchPlace } from "@/lib/db/queries/church-home";
import { CreatePlace } from "@/components/dashboard/church/church-flows";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function AddUnitPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/church/branches/${branchId}/units/new`);
  const place = await getChurchPlace(session.user.id, { branchId: Number(branchId) });
  if (!place) notFound();
  return <CreatePlace branch={place.branch} />;
}
