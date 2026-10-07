import { redirect } from "next/navigation";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { getAppSession } from "@/lib/app-session";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { getSogpDashboardAccess } from "@/lib/db/queries/sogp-journey";
import { resolveWelcomeDashboardSections } from "@/lib/welcome-dashboard-content";
import { resolveWelcomeDisplayName } from "@/lib/welcome-display-name";

export default async function WelcomeDashboardPage() {
  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard");
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
