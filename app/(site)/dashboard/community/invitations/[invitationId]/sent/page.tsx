import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { getSentInvitation } from "@/lib/db/queries/sogp-group-invitations";
import { InvitationSent } from "@/components/community/people/person-screens";

// Cache Components: reads the session and per-person data before rendering.
export const instant = false;

export default async function SentInvitationPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/invitations/${invitationId}/sent`);
  const leader = await getSogpEnrollmentByUserId(session.user.id);
  const invitation = leader && Number.isInteger(Number(invitationId)) ? await getSentInvitation(leader.id, Number(invitationId)) : null;
  if (!invitation) notFound();
  return <InvitationSent invitation={invitation} />;
}
