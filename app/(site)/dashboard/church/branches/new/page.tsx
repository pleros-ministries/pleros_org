import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import { CreatePlace } from "@/components/dashboard/church/church-flows";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function CreateBranchPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/church/branches/new");
  if ((await getChurchAssignment(session.user.id))?.role !== "pastor") notFound();
  return <CreatePlace />;
}
