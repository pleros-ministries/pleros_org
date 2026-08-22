import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { PrayerWatchPage } from "@/components/dashboard/prayer-watch-page";
import { getAppSession } from "@/lib/app-session";
import { getBibleReadingLogsForMonth } from "@/lib/db/queries/bible-reading";
import { getPrayerWatchAttendanceForMonth } from "@/lib/db/queries/prayer-watch";
import { toDateKey } from "@/lib/prayer-watch";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardPrayerWatchPage() {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (welcomeSession) {
    return (
      <PrayerWatchPage
        year={year}
        month={month}
        todayKey={toDateKey(now)}
        attendanceRecords={[]}
        bibleReadingLogs={[]}
      />
    );
  }

  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/welcome");
  }

  const [attendanceRecords, bibleReadingLogs] = await Promise.all([
    getPrayerWatchAttendanceForMonth(appSession.user.id, year, month),
    getBibleReadingLogsForMonth(appSession.user.id, year, month),
  ]);

  return (
    <PrayerWatchPage
      year={year}
      month={month}
      todayKey={toDateKey(now)}
      attendanceRecords={attendanceRecords}
      bibleReadingLogs={bibleReadingLogs}
    />
  );
}
