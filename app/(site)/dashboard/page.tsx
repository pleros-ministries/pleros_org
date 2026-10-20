import { redirect } from "next/navigation";

import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { getDashboardHomeData } from "@/lib/dashboard/home-data";
import { getDashboardViewer } from "@/lib/dashboard/viewer";
import { lagosGreeting } from "@/lib/dashboard/greeting";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { resolveWelcomeDisplayName } from "@/lib/welcome-display-name";

// Reads the session or params on every request (Cache Components).
export const instant = false;

export default async function WelcomeDashboardPage() {
  // Request-cached, so this shares the layout's session and capability reads.
  const viewer = await getDashboardViewer();

  if (!viewer) {
    redirect("/login?returnTo=/dashboard");
  }

  const appSession = viewer.session;
  const welcomeEmail = appSession.user.email;
  const [lead, data] = await Promise.all([
    getWelcomePackLeadByEmail(welcomeEmail),
    getDashboardHomeData(viewer),
  ]);
  const displayName = resolveWelcomeDisplayName({
    email: welcomeEmail,
    leadName: lead?.name,
    sessionName: appSession.user.name,
  });

  return (
    <>
      <DashboardHomeView name={displayName ?? undefined} greeting={lagosGreeting(new Date())} data={data} />
      <DashboardFooter />
    </>
  );
}
