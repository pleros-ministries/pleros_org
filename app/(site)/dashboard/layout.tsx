import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAppSession } from "@/lib/app-session";
import { recordDashboardVisit } from "@/lib/db/queries/admin-analytics";
import { normalizeLearnerReturnTo } from "@/lib/sogp/auth-flow";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pleros-pathname") ?? "/dashboard";
  const returnTo = normalizeLearnerReturnTo(pathname);
  const appSession = await getAppSession();

  if (!appSession) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  await recordDashboardVisit({
    visitorKey: appSession.user.id,
    visitorType: "user",
  });

  return <AppShell authenticated>{children}</AppShell>;
}
