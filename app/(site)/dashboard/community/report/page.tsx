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
import { getBibleDay, getTeachingReport, listMinistryDetails, listRecentTeachingTitles, reportPopupsReady } from "@/lib/db/queries/report-popups";
import { getOwnMinistryReportV3 } from "@/lib/db/queries/ministry-report-v3";
import { ministryEdit, type MinistryEdit } from "@/lib/community/report-popups";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { listPrayerOtherTimes } from "@/lib/db/queries/prayer-watch";
import { getNaturalAssignmentSummary } from "@/lib/db/queries/natural-assignment";

// Reads the session on every request (Cache Components).
export const instant = false;

/** Saved evangelism and discipleship reports that reopen in their pop-up; legacy activities keep the older edit page. */
async function loadMinistryEdits(userId: string, activities: MemberActivity[]): Promise<Record<number, MinistryEdit>> {
  const ids = activities.filter(row => row.kind === "outreach" || row.kind === "follow_up").map(row => row.id);
  if (!ids.length) return {};
  const [reports, details] = await Promise.all([
    Promise.all(ids.map(id => getOwnMinistryReportV3(userId, id).catch(() => null))),
    listMinistryDetails(ids).catch(() => ({} as Awaited<ReturnType<typeof listMinistryDetails>>)),
  ]);
  const edits: Record<number, MinistryEdit> = {};
  for (const report of reports) {
    const edit = report ? ministryEdit(report.activity, report.entry, report.contacts, details[report.activity.id]) : null;
    if (edit) edits[edit.activityId] = edit;
  }
  return edits;
}

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
  const plerosRead = getDayActivity(ctx.userId, selected);
  const activitiesRead = listActivitiesForDay(ctx.userId, selected);
  const [activities, edits, pleros, declarations, meetingDetails, sharedDetails, week, contacts, units, initialMeetings, popupsReady, bibleDay, teaching, teachings, prayerTimes, assignment] = await Promise.all([
    activitiesRead,
    inline ? activitiesRead.then(list => loadMinistryEdits(ctx.userId, list)).catch((): Record<number, MinistryEdit> => ({})) : Promise.resolve<Record<number, MinistryEdit>>({}),
    plerosRead,
    getOwnDailyDeclarations(ctx.userId, selected),
    getOwnMeetingDetails(ctx.userId, selected),
    getOwnSharedMeetingDetails(ctx.userId, selected),
    getOwnReportWeek(ctx.userId, days.slice(0, 7)).catch(() => null),
    inline ? listReportContactChoices(ctx.userId).catch(() => []) : Promise.resolve([]),
    unitsRead,
    unitsRead.then(list => list.length ? listSharedChurchMeetings(ctx.userId, list[0].id, selected).catch(() => undefined) : undefined),
    // Report pop-ups (migration 0068): Bible plan, Teaching note and this week's teachings.
    reportPopupsReady().catch(() => false),
    plerosRead.then(day => getBibleDay(ctx.userId, selected, day.bible)).catch(() => undefined),
    getTeachingReport(ctx.userId, selected).catch(() => null),
    inline ? listRecentTeachingTitles(ctx.userId, selected).catch(() => []) : Promise.resolve([]),
    // Times prayed under Another time (migration 0071).
    listPrayerOtherTimes(ctx.userId, selected).catch(() => [] as string[]),
    // Natural assignment under Other reports (migration 0073).
    getNaturalAssignmentSummary(ctx.userId, selected).catch(() => undefined),
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
      edits={edits}
      declarations={declarations}
      meetingDetails={[...meetingDetails, ...sharedDetails]}
      enabled={dailyReportingEnabled()}
      pleros={activityLines(pleros)}
      devotion={{ prayerWatch: pleros.prayerWatch, prayerTimes, bible: pleros.bible }}
      week={week}
      popupsReady={popupsReady}
      bibleDay={bibleDay}
      teaching={teaching}
      teachings={teachings}
      assignment={assignment}
    />
  );
}
