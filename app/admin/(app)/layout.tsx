import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";

export default async function AdminAppLayout({
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

  if (session.user.role === "student" && !isChurchAdmin) {
    redirect("/ppc");
  }

  return children;
}
