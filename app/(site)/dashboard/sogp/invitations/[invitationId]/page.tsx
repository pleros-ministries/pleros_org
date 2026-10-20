import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnInvitation } from "@/lib/db/queries/sogp-group-invitations";
import { InvitationResponse } from "@/components/sogp/follow-up-invitations";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function GroupInvitationPage({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/sogp/invitations/${invitationId}`);
  const invitation = Number.isInteger(Number(invitationId)) ? await getOwnInvitation(session.user.id, Number(invitationId)) : null;
  if (!invitation) notFound();
  return <InvitationResponse invitation={invitation} />;
}
