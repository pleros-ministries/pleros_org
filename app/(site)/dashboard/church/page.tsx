import { redirect } from "next/navigation";
import { canManageChurchAssignments } from "@/lib/church/permissions";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment, hasChurchDirectReports } from "@/lib/db/queries/church-organisation";
import { getChurchHome } from "@/lib/db/queries/church-home";
import { ChurchHomeView } from "@/components/dashboard/church/church-home";

export default async function ChurchPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/church");
  const viewer = await getChurchAssignment(session.user.id);
  // First-time Pastor setup stays on the retained setup controls.
  if (!viewer && session.user.role === "super_admin") redirect("/dashboard/church/reports");
  // Pastors and Branch Pastors manage structure inside Oversight (user request, 18 October).
  if (canManageChurchAssignments(viewer)) {
    const ctx = await getCommunityContext();
    if (ctx && canAccessCommunity(ctx)) redirect("/dashboard/community/oversight/structure");
  }
  const [data, oversees] = await Promise.all([getChurchHome(session.user.id), hasChurchDirectReports(session.user.id)]);
  return <ChurchHomeView data={data} canOversee={oversees || viewer?.role === "pastor" || viewer?.role === "branch_pastor"} />;
}
