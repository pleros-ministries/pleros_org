import { redirect } from "next/navigation";

import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { InstallAppCta } from "@/components/pwa/install-app-cta";
import { getDashboardHomeData } from "@/lib/dashboard/home-data";
import { getDashboardViewer } from "@/lib/dashboard/viewer";
import { lagosGreeting } from "@/lib/dashboard/greeting";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { resolveWelcomeDisplayName } from "@/lib/welcome-display-name";

export default async function WelcomeDashboardPage() {
  // Request-cached, so this shares the layout's session and capability reads.
  const viewer = await getDashboardViewer();

  if (!viewer) {
    redirect("/login?returnTo=/dashboard");
  }

  const appSession = viewer.session;
  const welcomeEmail = appSession.user.email;
  const lead = await getWelcomePackLeadByEmail(welcomeEmail);
  const displayName = resolveWelcomeDisplayName({
    email: welcomeEmail,
    leadName: lead?.name,
    sessionName: appSession.user.name,
  });
  const data = await getDashboardHomeData(viewer);

  return (
    <>
      <DashboardHomeView name={displayName ?? undefined} greeting={lagosGreeting(new Date())} data={data} />
      <div className="mx-auto max-w-[390px] px-5"><InstallAppCta /></div>
      <HomepageFooter />
    </>
  );
}
