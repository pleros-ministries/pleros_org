import { redirect } from "next/navigation";

import { canAccessArea } from "@/lib/app-access";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";

export default async function PastorOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) {
    redirect("/admin");
  }

  const churchAssignment = await getChurchAssignment(session.user.id);
  const isChurchAdmin =
    churchAssignment?.role === "pastor" ||
    churchAssignment?.role === "branch_pastor";

  if (!canAccessArea(session.user.role, "pastor") && !isChurchAdmin) {
    redirect("/admin/forbidden");
  }

  return children;
}
