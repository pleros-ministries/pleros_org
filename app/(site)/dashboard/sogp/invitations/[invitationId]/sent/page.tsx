import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { getSentInvitation } from "@/lib/db/queries/sogp-group-invitations";
import { SentInvitationView } from "@/components/sogp/follow-up-invitations";

export default async function SentInvitationPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/sogp/invitations/${invitationId}/sent`);
  const leader = await getSogpEnrollmentByUserId(session.user.id);
  const invitation = leader && Number.isInteger(Number(invitationId)) ? await getSentInvitation(leader.id, Number(invitationId)) : null;
  if (!invitation) notFound();
  return <SentInvitationView invitation={invitation} />;
}
