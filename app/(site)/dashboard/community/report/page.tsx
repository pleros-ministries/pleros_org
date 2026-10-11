import { canAccessReporting } from "@/lib/community/reporting-access";
import { redirect } from "next/navigation";

import { DailyReportView } from "@/components/community/report/daily-report-view";
import { dailyReportingEnabled, getOwnDailyDeclarations, getOwnMeetingDetails } from "@/lib/db/queries/daily-report-declarations";
import { getAppSession } from "@/lib/app-session";
import {
  getCommunityContext,
} from "@/lib/community/context";
import { activityLines, isDateKey, reportableDateKeys } from "@/lib/community/ministry-report";
import {
  getDayActivity,
  listActivitiesForDay,
} from "@/lib/db/queries/ministry-activities";
import { lagosToday } from "@/lib/sogp/daily-date";

export default async function MinistryReportRoute({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; saved?: string; removed?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report");

  const ctx = await getCommunityContext();
  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");

  const today = lagosToday();
  const days = reportableDateKeys(today);
  const { day, saved, removed } = await searchParams;
  const selected = isDateKey(day) && day <= today ? day : today;

  const [activities, pleros, declarations, meetingDetails] = await Promise.all([
    listActivitiesForDay(ctx.userId, selected),
    getDayActivity(ctx.userId, selected),
    getOwnDailyDeclarations(ctx.userId, selected),
    getOwnMeetingDetails(ctx.userId, selected),
  ]);

  return (
    <DailyReportView
      today={today}
      days={days}
      selected={selected}
      activities={activities}
      declarations={declarations}
      meetingDetails={meetingDetails}
      enabled={dailyReportingEnabled()}
      pleros={activityLines(pleros)}
      flash={saved ? "saved" : removed ? "removed" : null}
    />
  );
}
