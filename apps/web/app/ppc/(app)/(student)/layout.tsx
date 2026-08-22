import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { canAccessArea, getRoleDefaultPath } from "@/lib/app-access";
import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";

export default async function StudentAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) {
    const requestHeaders = await headers();
    redirect(toExternalPpcPath(requestHeaders.get("host"), "/"));
  }

  if (!canAccessArea(session.user.role, "student")) {
    redirect(getRoleDefaultPath(session.user.role));
  }

  return children;
}
