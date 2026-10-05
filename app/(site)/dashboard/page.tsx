import { redirect } from "next/navigation";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { getAppSession } from "@/lib/app-session";
import { summariseMinistryWeek } from "@/lib/community/ministry-report";
import { listReportsForUser } from "@/lib/db/queries/ministry-reports";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { getSogpDashboardAccess } from "@/lib/db/queries/sogp-journey";
import { resolveWelcomeDashboardSections } from "@/lib/welcome-dashboard-content";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";
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

  // Ministry reports belong to the community, which opens with enrolment.
  const today = lagosToday();
  const ministry = sogpAccess.isSogpEnrolled
    ? summariseMinistryWeek(
        await listReportsForUser(appSession.user.id, shiftDate(today, -6), today),
        today,
      )
    : null;

  return (
    <WelcomeDashboardView
      name={displayName ?? undefined}
      sections={sections}
      ministry={ministry}
    />
  );
}
