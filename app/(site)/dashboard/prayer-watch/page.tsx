import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PrayerWatchPage } from "@/components/dashboard/prayer-watch-page";
import { getAppSession } from "@/lib/app-session";
import { getPrayerWatchAttendanceForMonth } from "@/lib/db/queries/prayer-watch";
import { toDateKey } from "@/lib/prayer-watch";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardPrayerWatchPage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!appSession && welcomeSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard%2Fprayer-watch");
  }

  if (!appSession) {
    redirect("/welcome");
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const attendedDateKeys = await getPrayerWatchAttendanceForMonth(
    appSession.user.id,
    year,
    month,
  );

  return (
    <PrayerWatchPage
      year={year}
      month={month}
      todayKey={toDateKey(now)}
      attendedDateKeys={attendedDateKeys}
    />
  );
}
