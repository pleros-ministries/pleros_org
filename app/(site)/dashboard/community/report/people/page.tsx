import { redirect } from "next/navigation";

import { OutreachContactBrowser } from "@/components/community/report/outreach-contact-browser";
import { ReportTabs } from "@/components/community/report/report-tabs";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { listContactsForMember } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";

/** Most people one member's list will load; older ones drop off the end. */
const LIST_LIMIT = 1000;

export default async function PeopleMetRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/people");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const contacts = await listContactsForMember(ctx.userId, LIST_LIMIT);

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Daily report
        </h1>
        <p className="max-w-md text-sm text-zinc-500">
          Everyone you have met in ministry. Search and filter, log each
          follow-up, and keep their status up to date. Only you, your pastor
          and the Pleros team see these names and numbers.
        </p>
      </header>

      <ReportTabs active="people" />

      <section className="overflow-hidden rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)">
        <OutreachContactBrowser
          contacts={contacts}
          today={lagosToday()}
          viewer={{ userId: ctx.userId, isAdmin: ctx.isAdmin }}
          canDelete
          emptyText="You have not recorded anyone yet. Add the people you meet when you log an outreach."
        />
      </section>
    </div>
  );
}
