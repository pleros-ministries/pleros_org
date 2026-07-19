import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { resolveWelcomeDisplayName } from "@/lib/welcome-display-name";

export default async function WelcomeDashboardPage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!appSession && welcomeSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard");
  }

  if (!appSession) {
    redirect("/welcome");
  }

  const welcomeEmail = welcomeSession?.email ?? appSession.user.email;
  const lead = await getWelcomePackLeadByEmail(welcomeEmail);
  const displayName = resolveWelcomeDisplayName({
    email: welcomeEmail,
    leadName: lead?.name,
    welcomeName: welcomeSession?.name,
    sessionName: appSession.user.name,
  });

  return <WelcomeDashboardView name={displayName ?? undefined} />;
}
