import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { listLedGroupInvites } from "@/lib/db/queries/led-discipleship-invites";
import { getPrivateMinistryContact } from "@/lib/db/queries/private-ministry-contacts";
import { buildWhatsAppUrl } from "@/lib/sogp/discipleship";
import { WhatsAppGroupInvite } from "@/components/community/report/ministry-v3/whatsapp-invite";

export default async function WhatsAppInvitePage({ params, searchParams }: { params: Promise<{ contactId: string }>; searchParams: Promise<{ group?: string }> }) {
  const [{ contactId }, { group }] = await Promise.all([params, searchParams]);
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/report/people/private/${contactId}/invite`);
  const id = Number(contactId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // Owner-only: the contact must be the viewer's own private contact.
  const detail = await getPrivateMinistryContact(session.user.id, id).catch(error => { if (error instanceof CommunityError) return null; throw error; });
  if (!detail) notFound();
  const groups = await listLedGroupInvites(session.user.id);
  const preselect = Number(group);
  return <WhatsAppGroupInvite contact={{ name: detail.contact.name, phone: detail.contact.phone }} leaderName={session.user.name}
    groups={groups} initialGroupId={groups.some(item => item.id === preselect) ? preselect : undefined}
    whatsappBase={buildWhatsAppUrl(detail.contact.phone)} />;
}
