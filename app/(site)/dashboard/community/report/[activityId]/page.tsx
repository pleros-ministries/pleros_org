import { canAccessReporting } from "@/lib/community/reporting-access";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActivityForm } from "@/components/community/report/activity-form/activity-form";
import { dayHref } from "@/components/community/report/day-picker";
import { card, textLink } from "@/components/community/report/styles";
import { getAppSession } from "@/lib/app-session";
import {
  activityKeyNumbers,
  activityTitle,
  activityWhere,
  draftFromActivity,
} from "@/lib/community/activity-form";
import {
  getCommunityContext,
} from "@/lib/community/context";
import { canReportFor } from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";
import { getActivityForEdit } from "@/lib/db/queries/ministry-activities";
import { listContactsForMember } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";
import { dailyReportingEnabled, getOwnMeetingDetails } from "@/lib/db/queries/daily-report-declarations";
import type { MeetingReportingRole } from "@/lib/community/daily-report";
import { getOwnMinistryReportV3 } from "@/lib/db/queries/ministry-report-v3";
import { getOwnSharedMeetingReport, listMeetingUnits } from "@/lib/db/queries/shared-church-meetings";
import { listReportContactChoices } from "@/lib/db/queries/private-ministry-contacts";
import { LiveMinistryForm } from "@/components/community/report/ministry-v3/live-ministry-form";
import { LiveMeetingFlow } from "@/components/community/report/ministry-v3/live-meeting-flow";
import { reportingV3Enabled } from "@/lib/db/queries/reporting-v3-gate";

const CONTACT_LIMIT = 1000;

export default async function EditActivityRoute({
  params,
}: {
  params: Promise<{ activityId: string }>;
}) {
  const { activityId: raw } = await params;
  const activityId = Number(raw);
  if (!Number.isInteger(activityId) || activityId <= 0) notFound();

  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/report/${activityId}`);

  const ctx = await getCommunityContext();
  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");

  const activity = await getActivityForEdit(ctx.userId, activityId);
  if (!activity) notFound();

  const today = lagosToday();
  const [unified, shared] = await Promise.all([getOwnMinistryReportV3(ctx.userId, activityId), getOwnSharedMeetingReport(ctx.userId, activityId)]);
  if (unified) return <LiveMinistryForm dateKey={activity.activityDate} today={today} activityId={activityId} readOnly={!reportingV3Enabled() || !canReportFor(activity.activityDate, today)} contacts={await listReportContactChoices(ctx.userId)} initial={{
    dateKey: activity.activityDate, kind: activity.kind as "outreach" | "follow_up", method: unified.entry.method, context: unified.entry.context ?? "", note: activity.note ?? "", outcomes: unified.entry.enteredOutcomes, contacts: unified.contacts,
    peopleCount: activity.kind === "follow_up" ? activity.followUps : activity.reachedOnline + activity.reachedOffline,
    platform: activity.platform?.startsWith("other:") ? "other" : activity.platform ?? "", platformOther: activity.platform?.startsWith("other:") ? activity.platform.slice(6) : "", onlineCount: String(activity.reachedOnline), offlineCount: String(activity.reachedOffline),
  }} />;
  if (shared) return <LiveMeetingFlow dateKey={activity.activityDate} today={today} units={await listMeetingUnits(ctx.userId)} contacts={await listReportContactChoices(ctx.userId)} initial={shared} readOnly={!reportingV3Enabled() || !canReportFor(activity.activityDate, today)} />;
  if (!canReportFor(activity.activityDate, today)) {
    const where = activityWhere(activity);
    return (
      <div className="grid gap-4">
        <header className="grid gap-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            {activityTitle(activity)}
          </h1>
          <p className="text-sm text-zinc-500">{dateKeyLabel(activity.activityDate)}</p>
        </header>
        <section className={`${card} grid gap-1.5 p-4`}>
          {where ? <p className="text-xs text-zinc-500">{where}</p> : null}
          <p className="text-sm text-zinc-800">{activityKeyNumbers(activity)}</p>
          {activity.note ? <p className="text-sm text-zinc-600">{activity.note}</p> : null}
          <p className="pt-1 text-xs text-zinc-500">This day can no longer be changed.</p>
        </section>
        <Link href={dayHref(today, today)} className={`${textLink} w-fit`}>
          Back to today
        </Link>
      </div>
    );
  }

  const contacts =
    activity.kind === "follow_up"
      ? await listContactsForMember(ctx.userId, CONTACT_LIMIT)
      : [];

  return (
    <ActivityForm
      mode="edit"
      dailyReporting={dailyReportingEnabled()}
      initialMeeting={await getOwnMeetingDetails(ctx.userId, activity.activityDate).then((rows) => {
        const row = rows.find((item) => item.activityId === activity.id);
        return row ? { role: row.reportingRole as MeetingReportingRole, taught: row.taught } : undefined;
      })}
      today={today}
      dateKey={activity.activityDate}
      activityId={activity.id}
      initial={draftFromActivity(activity)}
      contacts={contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        note: contact.note,
        metDate: contact.metDate,
        followedUpAt: contact.followedUpAt,
        salvationStatus: contact.salvationStatus,
      }))}
    />
  );
}
