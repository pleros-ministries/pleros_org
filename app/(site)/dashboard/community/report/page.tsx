import { canAccessReporting } from "@/lib/community/reporting-access";
import { redirect } from "next/navigation";

import { DailyReportSections } from "@/components/community/report/daily-report-sections";
import { reportingV3Enabled } from "@/lib/db/queries/reporting-v3-gate";
import { listReportContactChoices } from "@/lib/db/queries/private-ministry-contacts";
import { listMeetingUnits, listSharedChurchMeetings } from "@/lib/db/queries/shared-church-meetings";
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
import { getOwnSharedMeetingDetails } from "@/lib/db/queries/shared-church-meetings";
import { getOwnReportWeek } from "@/lib/db/queries/own-report-week";

export default async function MinistryReportRoute({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/report");

  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");

  const today = lagosToday();
  const days = reportableDateKeys(today);
  const { day } = await searchParams;
  const selected = isDateKey(day) && day <= today ? day : today;

  // The one-page report embeds the ministry and meeting forms, so their choices load here too.
  const inline = reportingV3Enabled() && days.includes(selected);
  const unitsRead = inline ? listMeetingUnits(ctx.userId).catch(() => []) : Promise.resolve([]);
  const [activities, pleros, declarations, meetingDetails, sharedDetails, week, contacts, units, initialMeetings] = await Promise.all([
    listActivitiesForDay(ctx.userId, selected),
    getDayActivity(ctx.userId, selected),
    getOwnDailyDeclarations(ctx.userId, selected),
    getOwnMeetingDetails(ctx.userId, selected),
    getOwnSharedMeetingDetails(ctx.userId, selected),
    getOwnReportWeek(ctx.userId, days.slice(0, 7)).catch(() => null),
    inline ? listReportContactChoices(ctx.userId).catch(() => []) : Promise.resolve([]),
    unitsRead,
    unitsRead.then(list => list.length ? listSharedChurchMeetings(ctx.userId, list[0].id, selected).catch(() => undefined) : undefined),
  ]);

  return (
    <DailyReportSections
      inline={inline}
      contacts={contacts}
      units={units}
      initialMeetings={initialMeetings}
      today={today}
      days={days}
      selected={selected}
      activities={activities}
      declarations={declarations}
      meetingDetails={[...meetingDetails, ...sharedDetails]}
      enabled={dailyReportingEnabled()}
      pleros={activityLines(pleros)}
      week={week}
    />
  );
}
