import { canAccessReporting } from "@/lib/community/reporting-access";
import { redirect } from "next/navigation";

import { ActivityForm } from "@/components/community/report/activity-form/activity-form";
import { getAppSession } from "@/lib/app-session";
import { emptyDraft } from "@/lib/community/activity-form";
import {
  getCommunityContext,
} from "@/lib/community/context";
import { reportableDateKeys } from "@/lib/community/ministry-report";
import { listContactsForMember } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";
import { dailyReportingEnabled } from "@/lib/db/queries/daily-report-declarations";
import { reportingV3Enabled, reportingV3SchemaReady } from "@/lib/db/queries/reporting-v3-gate";
import { listReportContactChoices } from "@/lib/db/queries/private-ministry-contacts";
import { LiveMinistryForm } from "@/components/community/report/ministry-v3/live-ministry-form";
import { LiveMeetingFlow } from "@/components/community/report/ministry-v3/live-meeting-flow";
import { listMeetingUnits, listSharedChurchMeetings } from "@/lib/db/queries/shared-church-meetings";
import Link from "next/link";

/** Most people offered to the follow-up step. */
const CONTACT_LIMIT = 1000;

export default async function NewActivityRoute({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; category?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/new");

  const ctx = await getCommunityContext();
  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");

  const today = lagosToday();
  const days = reportableDateKeys(today);
  const { day, category } = await searchParams;
  const dateKey = day && days.includes(day) ? day : today;

  if (reportingV3Enabled()) {
    const savedContacts = await listReportContactChoices(ctx.userId);
    if (category === "meetings") {
      const units = await listMeetingUnits(ctx.userId);
      return <LiveMeetingFlow dateKey={dateKey} today={today} units={units} contacts={savedContacts} initialMeetings={units.length ? await listSharedChurchMeetings(ctx.userId, units[0].id, dateKey) : []} />;
    }
    return <><nav className="px-4 pt-4 text-[13px]"><Link className="text-(--color-brand-blue) underline" href={`/dashboard/community/report/new?category=meetings&day=${dateKey}`}>Record meeting attendance</Link></nav><LiveMinistryForm dateKey={dateKey} today={today} contacts={savedContacts} /></>;
  }

  if (reportingV3SchemaReady()) return <div role="status" className="grid gap-3 p-4"><h1>Reporting is temporarily view only</h1><p>Your saved contacts and existing reports are still available.</p><Link className="text-(--color-brand-blue) underline" href="/dashboard/community/report/history">View report history</Link></div>;
  const contacts = await listContactsForMember(ctx.userId, CONTACT_LIMIT);

  return (
    <ActivityForm
      mode="create"
      dailyReporting={dailyReportingEnabled()}
      category={category === "ministry" || category === "meetings" ? category : undefined}
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
