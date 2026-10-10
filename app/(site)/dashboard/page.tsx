import { redirect } from "next/navigation";

import { WelcomeDashboardView } from "@/components/dashboard/welcome-dashboard-view";
import { getDashboardViewer } from "@/lib/dashboard/viewer";
import { lagosGreeting } from "@/lib/dashboard/greeting";
import { getZonedMinutesSinceMidnight } from "@/lib/notifications/zoned-time";
import {
  getNextPrayerWatchSessionId,
  PRAYER_WATCH_SESSIONS,
  PRAYER_WATCH_TIME_ZONE,
} from "@/lib/prayer-watch";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { resolveWelcomeDashboardSections } from "@/lib/welcome-dashboard-content";
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
  const sections = resolveWelcomeDashboardSections({ ...viewer.sogpAccess, communityAccess: viewer.capabilities.community });

  const now = new Date();
  const nextSession = PRAYER_WATCH_SESSIONS.find(
    (session) => session.id === getNextPrayerWatchSessionId(now),
  )!;
  const minutesNow = getZonedMinutesSinceMidnight(now, PRAYER_WATCH_TIME_ZONE);

  return (
    <WelcomeDashboardView
      name={displayName ?? undefined}
      greeting={lagosGreeting(now)}
      prayerWatch={{
        label: nextSession.label,
        time: nextSession.time,
        today: nextSession.hour * 60 + nextSession.minute >= minutesNow,
      }}
      sections={sections}
    />
  );
}
