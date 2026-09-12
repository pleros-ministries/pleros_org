import { redirect } from "next/navigation";

import { canAccessArea } from "@/lib/app-access";
import { getAppSession } from "@/lib/app-session";

export default async function PastorOnlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) {
    redirect("/admin");
  }

  if (!canAccessArea(session.user.role, "pastor")) {
    redirect("/admin/forbidden");
  }

  return children;
}
