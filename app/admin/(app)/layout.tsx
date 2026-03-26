import { redirect } from "next/navigation";

import { PpcAppFrame } from "@/components/ppc/ppc-app-frame";
import { getAppSession } from "@/lib/app-session";

export default async function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) {
    redirect("/admin");
  }

  if (session.user.role === "student") {
    redirect("/ppc");
  }

  return <PpcAppFrame session={session}>{children}</PpcAppFrame>;
}
