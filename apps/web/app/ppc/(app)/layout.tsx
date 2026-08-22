import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { PpcAppFrame } from "@/components/ppc/ppc-app-frame";
import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";

export default async function PpcAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAppSession();

  if (!session) {
    const requestHeaders = await headers();
    redirect(toExternalPpcPath(requestHeaders.get("host"), "/"));
  }

  return <PpcAppFrame session={session}>{children}</PpcAppFrame>;
}
