import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { getSogpDashboardAccess } from "@/lib/db/queries/sogp-journey";
import { resolveWelcomeDashboardSections } from "@/lib/welcome-dashboard-content";
import { resolveWelcomeDisplayName } from "@/lib/welcome-display-name";

export default async function WelcomeDashboardPage() {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeSession) {
    const lead = await getWelcomePackLeadByEmail(welcomeSession.email);
    const displayName = resolveWelcomeDisplayName({
      email: welcomeSession.email,
      leadName: lead?.name,
      welcomeName: welcomeSession.name,
    });

    return <WelcomeDashboardView name={displayName ?? undefined} />;
  }

  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/welcome");
  }

  const welcomeEmail = appSession.user.email;
  const [lead, sogpAccess] = await Promise.all([
    getWelcomePackLeadByEmail(welcomeEmail),
    getSogpDashboardAccess(appSession.user.id),
  ]);
  const displayName = resolveWelcomeDisplayName({
    email: welcomeEmail,
    leadName: lead?.name,
    sessionName: appSession.user.name,
  });
  const sections = resolveWelcomeDashboardSections(sogpAccess);

  return (
    <WelcomeDashboardView
      name={displayName ?? undefined}
      sections={sections}
    />
  );
}
