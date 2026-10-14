import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { getPrivateMinistryContact } from "@/lib/db/queries/private-ministry-contacts";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { buildDiscipleshipInviteUrl, buildWhatsAppUrl } from "@/lib/sogp/discipleship";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import { WhatsAppGroupInvite } from "@/components/community/report/ministry-v3/whatsapp-invite";

export default async function WhatsAppInvitePage({ params }: { params: Promise<{ contactId: string }> }) {
  const { contactId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/report/people/private/${contactId}/invite`);
  const id = Number(contactId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  // Owner-only: the contact must be the viewer's own private contact.
  const detail = await getPrivateMinistryContact(session.user.id, id).catch(error => { if (error instanceof CommunityError) return null; throw error; });
  if (!detail) notFound();
  const leader = await getSogpEnrollmentByUserId(session.user.id);
  const groups = leader ? await db.select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name, code: s.discipleshipGroups.inviteCode }).from(s.discipleshipGroups)
    .where(and(eq(s.discipleshipGroups.leaderEnrollmentId, leader.id), eq(s.discipleshipGroups.status, "active"))).orderBy(asc(s.discipleshipGroups.createdAt)) : [];
  const site = resolvePublicSiteUrl(process.env);
  return <WhatsAppGroupInvite contact={{ name: detail.contact.name, phone: detail.contact.phone }} leaderName={session.user.name}
    groups={groups.map(group => ({ id: group.id, name: group.name, inviteUrl: buildDiscipleshipInviteUrl(site, group.code) }))}
    whatsappBase={buildWhatsAppUrl(detail.contact.phone)} />;
}
