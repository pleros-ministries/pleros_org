import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { recordDashboardVisit } from "@/lib/db/queries/admin-analytics";
import { normalizeLearnerReturnTo } from "@/lib/sogp/auth-flow";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const pathname = requestHeaders.get("x-pleros-pathname") ?? "/dashboard";
  const returnTo = normalizeLearnerReturnTo(pathname);
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  const welcomePathAllowed =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/welcomepack");

  if (welcomeSession && welcomePathAllowed) {
    await recordDashboardVisit({
      visitorKey: welcomeSession.email,
      visitorType: "welcome",
    });

    return <AppShell>{children}</AppShell>;
  }

  const appSession = await getAppSession();

  if (!appSession) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  await recordDashboardVisit({
    visitorKey: appSession.user.id,
    visitorType: "user",
  });

  return <AppShell>{children}</AppShell>;
}
