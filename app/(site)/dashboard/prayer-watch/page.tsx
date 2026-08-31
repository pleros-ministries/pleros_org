import { redirect } from "next/navigation";

import { PrayerWatchPage } from "@/components/dashboard/prayer-watch-page";
import { getAppSession } from "@/lib/app-session";
import { getBibleReadingLogsForMonth } from "@/lib/db/queries/bible-reading";
import { getPrayerWatchAttendanceForMonth } from "@/lib/db/queries/prayer-watch";
import { toDateKey } from "@/lib/prayer-watch";

export default async function DashboardPrayerWatchPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/login?returnTo=/dashboard/prayer-watch");
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
