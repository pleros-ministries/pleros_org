import { redirect } from "next/navigation";

import {
  MinistryReportView,
  type ReportHistoryDay,
} from "@/components/community/report/ministry-report-view";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import {
  activityLines,
  reportableDateKeys,
  sumMinistryNumbers,
} from "@/lib/community/ministry-report";
import {
  getActivityRange,
  getDayActivity,
  listReportsForUser,
} from "@/lib/db/queries/ministry-reports";
import { listContactsForDay } from "@/lib/db/queries/outreach-contacts";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";
import { enumerateDateKeys } from "@/lib/sogp/daily-participation";

const HISTORY_DAYS = 14;

export default async function MinistryReportRoute({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const today = lagosToday();
  const days = reportableDateKeys(today);
  const { day } = await searchParams;
  const selected = day && days.includes(day) ? day : today;

  const historyFrom = shiftDate(today, -(HISTORY_DAYS - 1));
  const monthStart = `${today.slice(0, 8)}01`;
  const loadFrom = monthStart < historyFrom ? monthStart : historyFrom;

  const [reports, activity, activityRange, people] = await Promise.all([
    listReportsForUser(ctx.userId, loadFrom, today),
    getDayActivity(ctx.userId, selected),
    getActivityRange(ctx.userId, historyFrom, today),
    listContactsForDay(ctx.userId, selected),
  ]);
  const reportByDay = new Map(reports.map((report) => [report.reportDate, report]));
  // SOGP only applies to someone in a cohort; a quiet day still shows its dot.
  const quietDay = {
    bible: false,
    prayerWatch: false,
    podcastEpisodes: 0,
    sogp: activity.sogp !== null ? false : null,
  };

  const history: ReportHistoryDay[] = enumerateDateKeys(historyFrom, today)
    .reverse()
    .map((dateKey) => ({
      dateKey,
      report: reportByDay.get(dateKey) ?? null,
      activity: activityRange.get(dateKey) ?? quietDay,
    }));

  const weekStart = shiftDate(today, -6);

  return (
    <MinistryReportView
      key={selected}
      today={today}
      days={days}
      selected={selected}
      report={reportByDay.get(selected) ?? null}
      activity={activityLines(activity)}
      history={history}
      people={people}
      weekTotals={sumMinistryNumbers(
        reports.filter((report) => report.reportDate >= weekStart),
      )}
      monthTotals={sumMinistryNumbers(
        reports.filter((report) => report.reportDate >= monthStart),
      )}
    />
  );
}
