import { notFound, redirect } from "next/navigation";

import { InvitePerson } from "@/components/community/people/person-screens";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { listInviteGroups } from "@/lib/db/queries/invite-groups";
import { getPrivateMinistryContact } from "@/lib/db/queries/private-ministry-contacts";
import { buildWhatsAppUrl } from "@/lib/sogp/discipleship";

// Cache Components: reads the session and per-person data before rendering.
export const instant = false;

/** Share one of the viewer's group invite links with a private contact on WhatsApp. */
export default async function WhatsAppInvitePage({ params, searchParams }: { params: Promise<{ contactId: string }>; searchParams: Promise<{ group?: string }> }) {
  const [{ contactId }, { group }] = await Promise.all([params, searchParams]);
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/contacts/${contactId}/invite`);
  const id = Number(contactId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // Owner-only: the contact must be the viewer's own private contact.
  const detail = await getPrivateMinistryContact(session.user.id, id).catch(error => { if (error instanceof CommunityError) return null; throw error; });
  if (!detail) notFound();
  const groups = await listInviteGroups(session.user.id);
  const preselect = Number(group);
  return <>
    <CrumbLabel href={`/dashboard/community/contacts/${id}`} label={detail.contact.name} />
    <InvitePerson person={{ kind: "contact", privateContactId: id, name: detail.contact.name, whatsappBase: buildWhatsAppUrl(detail.contact.phone) }}
      groups={groups} initialGroupId={groups.some(item => item.id === preselect) ? preselect : undefined}
      leaderFirstName={(session.user.name ?? "").split(/\s+/)[0] || "Your discipler"} />
  </>;
}
