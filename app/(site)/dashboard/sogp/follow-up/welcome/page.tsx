import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnFollowUpWelcome } from "@/lib/db/queries/sogp-follow-up-routes";
import { listOwnPendingInvitations } from "@/lib/db/queries/sogp-group-invitations";
import { FollowUpWelcome } from "@/components/sogp/follow-up-invitations";

export default async function FollowUpWelcomePage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/follow-up/welcome");
  const [data, invitations] = await Promise.all([getOwnFollowUpWelcome(session.user.id), listOwnPendingInvitations(session.user.id)]);
  if (!data) redirect("/sogp/enrol");
  // Direct joins and older enrolments have no referral welcome.
  if (!data.ownerName || (data.source !== "code" && data.source !== "link")) redirect("/dashboard/sogp/follow-up");
  const referral = invitations.find(invitation => invitation.origin === "referral");
  return <FollowUpWelcome data={{ ...data, ownerName: data.ownerName }} invitationId={referral?.id ?? null} />;
}
