import { canAccessReporting } from "@/lib/community/reporting-access";
import { redirect } from "next/navigation";

import { OutreachContactBrowser } from "@/components/community/report/outreach-contact-browser";
import { ReportTabs } from "@/components/community/report/report-tabs";
import { getAppSession } from "@/lib/app-session";
import {
  getCommunityContext,
} from "@/lib/community/context";
import { listContactsForMember } from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";
import { reportingV3Enabled, reportingV3SchemaReady } from "@/lib/db/queries/reporting-v3-gate";
import { listPrivateMinistryContacts } from "@/lib/db/queries/private-ministry-contacts";
import { SavedContacts } from "@/components/community/report/ministry-v3/saved-contacts";

/** Most people one member's list will load; older ones drop off the end. */
const LIST_LIMIT = 1000;

export default async function PeopleMetRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/people");

  const ctx = await getCommunityContext();
  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");

  const contacts = await listContactsForMember(ctx.userId, LIST_LIMIT);

  if (reportingV3SchemaReady()) {
    const privateContacts = await listPrivateMinistryContacts(ctx.userId);
    return <div className="grid gap-8">
      <SavedContacts contacts={privateContacts} readOnly={!reportingV3Enabled()} />
      {contacts.length ? <details className="mx-auto w-full max-w-140 rounded-xl border border-(--color-line) bg-white">
        <summary className="flex min-h-12 cursor-pointer items-center px-4 text-[14px] font-medium">People met in earlier reports ({contacts.length})</summary>
        <div className="border-t border-(--color-line)"><OutreachContactBrowser contacts={contacts} today={lagosToday()} viewer={{ userId: ctx.userId, isAdmin: ctx.isAdmin }} canDelete emptyText="" /></div>
      </details> : null}
    </div>;
  }

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Daily report
        </h1>
        <p className="max-w-md text-sm text-zinc-500">
          Everyone you have met in ministry. Search and filter, log each follow-up, and keep their status up to date. Only you, your pastor and the Pleros team see these names and numbers.
        </p>
      </header>

      <ReportTabs active="people" />
      <section className="overflow-hidden rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)">
        <OutreachContactBrowser
          contacts={contacts}
          today={lagosToday()}
          viewer={{ userId: ctx.userId, isAdmin: ctx.isAdmin }}
          canDelete
          emptyText="You have not recorded anyone yet. Add the people you meet when you log evangelism."
        />
      </section>
    </div>
  );
}
