import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PushBindingSync } from "@/components/push/push-binding-sync";
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

  // The SOGP journey page and its podcast lookalike have their own header and
  // navigation, so they skip the generic site nav/footer that wraps every
  // other dashboard route.
  if (pathname === "/dashboard/sogp" || pathname === "/dashboard/podcast") {
    return (
      <>
        <PushBindingSync userId={appSession.user.id} />
        {children}
      </>
    );
  }

  return (
    <>
      <PushBindingSync userId={appSession.user.id} />
      <AppShell authenticated>{children}</AppShell>
    </>
  );
}
