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
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { canReportFor } from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";
import { getActivityForEdit } from "@/lib/db/queries/ministry-activities";
import { listContactsForMember } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";

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
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const activity = await getActivityForEdit(ctx.userId, activityId);
  if (!activity) notFound();

  const today = lagosToday();
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
