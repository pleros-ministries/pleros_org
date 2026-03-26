import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function WelcomeDashboardPage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!welcomeSession) {
    redirect("/");
  }

  if (!appSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard");
  }

  return <WelcomeDashboardView />;
}
