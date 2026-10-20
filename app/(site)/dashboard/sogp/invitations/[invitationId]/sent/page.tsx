import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** The sent-invitation page moved into Community (17 October); old links keep working. */
export default async function OldSentInvitation({ params }: { params: Promise<{ invitationId: string }> }) {
  const { invitationId } = await params;
  redirect(`/dashboard/community/invitations/${encodeURIComponent(invitationId)}/sent`);
}
