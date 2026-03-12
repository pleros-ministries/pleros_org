import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { PpcShell } from "@/components/ppc/ppc-shell";
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
    redirect(toExternalPpcPath(requestHeaders.get("host"), "/sign-in"));
  }

  return <PpcShell session={session}>{children}</PpcShell>;
}
