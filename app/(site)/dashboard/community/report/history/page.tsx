import { redirect } from "next/navigation";

import {
  ReportHistoryView,
  type HistoryDay,
} from "@/components/community/report/report-history-view";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { groupActivitiesByDay } from "@/lib/community/ministry-activities";
import { reportableDateKeys, sumMinistryNumbers } from "@/lib/community/ministry-report";
import {
  getActivityRange,
  getDayActivity,
  listActivitiesForUser,
} from "@/lib/db/queries/ministry-activities";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";
import { enumerateDateKeys } from "@/lib/sogp/daily-participation";

const HISTORY_DAYS = 14;

export default async function ReportHistoryRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/history");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const today = lagosToday();
  const historyFrom = shiftDate(today, -(HISTORY_DAYS - 1));
  const weekStart = shiftDate(today, -6);
  const monthStart = `${today.slice(0, 8)}01`;
  const loadFrom = monthStart < historyFrom ? monthStart : historyFrom;

  const [activities, activityRange, todayActivity] = await Promise.all([
    listActivitiesForUser(ctx.userId, loadFrom, today),
    getActivityRange(ctx.userId, historyFrom, today),
    getDayActivity(ctx.userId, today),
  ]);
  const byDay = groupActivitiesByDay(activities);
  // SOGP only applies to someone in a cohort; a quiet day still shows its dot.
  const quietDay = {
    bible: false,
    prayerWatch: false,
    podcastEpisodes: 0,
    sogp: todayActivity.sogp !== null ? false : null,
  };

  const days: HistoryDay[] = enumerateDateKeys(historyFrom, today)
    .reverse()
    .map((dateKey) => ({
      dateKey,
      activities: byDay.get(dateKey) ?? [],
      activity: activityRange.get(dateKey) ?? quietDay,
    }));

  const week = activities.filter((activity) => activity.activityDate >= weekStart);
  const month = activities.filter((activity) => activity.activityDate >= monthStart);

  return (
    <ReportHistoryView
      today={today}
      reportable={reportableDateKeys(today)}
      days={days}
      week={{ count: week.length, totals: sumMinistryNumbers(week) }}
      month={{ count: month.length, totals: sumMinistryNumbers(month) }}
    />
  );
}
