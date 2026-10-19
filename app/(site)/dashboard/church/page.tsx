import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";

// Reads the session on every request (Cache Components).
export const instant = false;

/**
 * The church page is retired (groups as oversight, 19 October): the Pastor's
 * branches live in Oversight's Structure, everyone else's oversight in groups.
 * First-time Pastor setup keeps its page.
 */
export default async function ChurchPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/church");
  const viewer = await getChurchAssignment(session.user.id);
  if (!viewer && session.user.role === "super_admin") redirect("/dashboard/church/reports");
  redirect(viewer?.role === "pastor" ? "/dashboard/community/oversight/structure" : "/dashboard/community/oversight");
}
