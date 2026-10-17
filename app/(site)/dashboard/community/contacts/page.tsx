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
import { SavedContactsList } from "@/components/community/people/people-lists";
import people from "@/components/community/discipleship/discipleship-group.module.css";
import { listContactInviteStatus } from "@/lib/db/queries/people-follow-ups";

/** Most people one member's list will load; older ones drop off the end. */
const LIST_LIMIT = 1000;

export default async function PeopleMetRoute() {
  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/contacts");
  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");

  const contacts = await listContactsForMember(ctx.userId, LIST_LIMIT);

  if (reportingV3SchemaReady()) {
    const [privateContacts, invites] = await Promise.all([listPrivateMinistryContacts(ctx.userId), listContactInviteStatus(ctx.userId)]);
    return <div className="grid gap-6">
      <SavedContactsList contacts={privateContacts} invites={Object.fromEntries(invites)} readOnly={!reportingV3Enabled()} />
      {/* People recorded before saved contacts existed. They live in the shared outreach
          records (your pastor can see them too), so they keep their own list. */}
      {contacts.length ? <section className={people.page} aria-labelledby="earlier-people">
        <div className={people.sectionTitle}><h2 id="earlier-people">People met in earlier reports</h2><span className={people.rowMeta}>{contacts.length}</span></div>
        <details className={people.panel}>
          <summary className={people.row} style={{ cursor: "pointer", listStyle: "none" }}>
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#f1f2f5] text-[var(--color-community-muted)]" aria-hidden="true">◎</span>
            <span className={people.rowCopy}><span className={people.rowTitle} style={{ fontWeight: 500 }}>Show {contacts.length} {contacts.length === 1 ? "person" : "people"}</span><span className={people.rowMeta} style={{ whiteSpace: "normal" }}>Added in evangelism reports before saved contacts. Your pastor can see these.</span></span>
          </summary>
          <div className="border-t border-(--color-line)"><OutreachContactBrowser contacts={contacts} today={lagosToday()} viewer={{ userId: ctx.userId, isAdmin: ctx.isAdmin }} canDelete emptyText="" /></div>
        </details>
      </section> : null}
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
