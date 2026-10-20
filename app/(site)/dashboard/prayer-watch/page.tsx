import { redirect } from "next/navigation";

import { PrayerWatchPage } from "@/components/dashboard/prayer-watch-page";
import { getAppSession } from "@/lib/app-session";
import { getBibleReadingLogsForMonth } from "@/lib/db/queries/bible-reading";
import { getPrayerWatchAttendanceForMonth } from "@/lib/db/queries/prayer-watch";
import { isDateKey } from "@/lib/community/ministry-report";
import { toDateKey } from "@/lib/prayer-watch";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function DashboardPrayerWatchPage({ searchParams }: { searchParams: Promise<{ date?: string; tab?: string }> }) {
  const params = await searchParams;
  // After the request data, so the clock is read at request time, never in the prerender.
  const now = new Date();
  const todayKey = toDateKey(now);
  const selected = isDateKey(params.date) && params.date <= todayKey ? params.date : null;
  const year = Number((selected ?? todayKey).slice(0, 4));
  const month = Number((selected ?? todayKey).slice(5, 7)) - 1;

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
      todayKey={todayKey}
      initialDateKey={selected}
      initialTab={params.tab === "bible" ? "bible" : "prayer"}
      attendanceRecords={attendanceRecords}
      bibleReadingLogs={bibleReadingLogs}
    />
  );
}
