import { redirect } from "next/navigation";

/** The sent-invitation page moved into Community (17 October); old links keep working. */
export default async function OldSentInvitation({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  redirect(`/dashboard/community/invitations/${encodeURIComponent(invitationId)}/sent`);
}
