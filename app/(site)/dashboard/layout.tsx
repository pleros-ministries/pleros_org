import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { recordDashboardVisit } from "@/lib/db/queries/admin-analytics";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeSession) {
    await recordDashboardVisit({
      visitorKey: welcomeSession.email,
      visitorType: "welcome",
    });

    return <AppShell>{children}</AppShell>;
  }

  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/welcome");
  }

  await recordDashboardVisit({
    visitorKey: appSession.user.id,
    visitorType: "user",
  });

  return <AppShell>{children}</AppShell>;
}
