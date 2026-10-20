import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnFollowUpWelcome } from "@/lib/db/queries/sogp-follow-up-routes";
import { FollowUpWelcome } from "@/components/sogp/follow-up-invitations";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function FollowUpWelcomePage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/follow-up/welcome");
  const data = await getOwnFollowUpWelcome(session.user.id);
  if (!data) redirect("/sogp/enrol");
  // Direct joins and older enrolments have no referral welcome.
  if (!data.ownerName || (data.source !== "code" && data.source !== "link")) redirect("/dashboard/sogp/follow-up");
  return <FollowUpWelcome data={{ ...data, ownerName: data.ownerName }} />;
}
