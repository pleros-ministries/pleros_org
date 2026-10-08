import { redirect } from "next/navigation";

import { ReportDayView } from "@/components/community/report/report-day-view";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { activityLines, reportableDateKeys } from "@/lib/community/ministry-report";
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
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const today = lagosToday();
  const days = reportableDateKeys(today);
  const { day, saved, removed } = await searchParams;
  const selected = day && days.includes(day) ? day : today;

  const [activities, pleros] = await Promise.all([
    listActivitiesForDay(ctx.userId, selected),
    getDayActivity(ctx.userId, selected),
  ]);

  return (
    <ReportDayView
      today={today}
      days={days}
      selected={selected}
      activities={activities}
      pleros={activityLines(pleros)}
      flash={saved ? "saved" : removed ? "removed" : null}
    />
  );
}
