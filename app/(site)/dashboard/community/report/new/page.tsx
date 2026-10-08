import { redirect } from "next/navigation";

import { ActivityForm } from "@/components/community/report/activity-form/activity-form";
import { getAppSession } from "@/lib/app-session";
import { emptyDraft } from "@/lib/community/activity-form";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { reportableDateKeys } from "@/lib/community/ministry-report";
import { listContactsForMember } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";

/** Most people offered to the follow-up step. */
const CONTACT_LIMIT = 1000;

export default async function NewActivityRoute({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/new");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const today = lagosToday();
  const days = reportableDateKeys(today);
  const { day } = await searchParams;
  const dateKey = day && days.includes(day) ? day : today;

  const contacts = await listContactsForMember(ctx.userId, CONTACT_LIMIT);

  return (
    <ActivityForm
      mode="create"
      today={today}
      dateKey={dateKey}
      initial={emptyDraft(dateKey)}
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
