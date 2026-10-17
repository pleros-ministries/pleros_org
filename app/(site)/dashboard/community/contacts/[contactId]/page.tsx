import { notFound, redirect } from "next/navigation";

import { ContactDetail } from "@/components/community/people/person-screens";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { phoneHref } from "@/lib/community/outreach-contacts";
import { listContactInviteStatus, listFollowUps } from "@/lib/db/queries/people-follow-ups";
import { getPrivateMinistryContact } from "@/lib/db/queries/private-ministry-contacts";
import { reportingV3SchemaReady } from "@/lib/db/queries/reporting-v3-gate";
import { buildWhatsAppUrl } from "@/lib/sogp/discipleship";

/** One of the viewer's private saved contacts. Owner-only. */
export default async function PrivateContactPage({ params }: { params: Promise<{ contactId: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/contacts");
  if (!reportingV3SchemaReady()) notFound();
  const id = Number((await params).contactId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const detail = await getPrivateMinistryContact(session.user.id, id).catch(error => { if (error instanceof CommunityError) return null; throw error; });
  if (!detail) notFound();
  const [followUps, invites] = await Promise.all([listFollowUps(session.user.id, { privateContactId: id }), listContactInviteStatus(session.user.id)]);
  const { contact } = detail;
  const first = contact.name.trim().split(/\s+/)[0] || contact.name;
  return <>
    <CrumbLabel href={`/dashboard/community/contacts/${id}`} label={contact.name} />
    <ContactDetail followUps={followUps} contact={{
      id: contact.id, name: contact.name, phone: contact.phone, email: contact.email, note: contact.note, createdAt: contact.createdAt,
      whatsappUrl: buildWhatsAppUrl(contact.phone, null, `Hi ${first}, `), callHref: phoneHref(contact.phone),
      history: detail.history.map(row => ({ activityId: row.activityId, date: row.date, kind: row.kind })),
      invite: invites.get(id) ?? null,
    }} />
  </>;
}
