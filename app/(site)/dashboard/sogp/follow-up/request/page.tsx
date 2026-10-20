import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnFollowUpView } from "@/lib/db/queries/sogp-follow-up-requests";
import { FollowUpRequest } from "@/components/sogp/follow-up-request";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function FollowUpRequestPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/follow-up/request");
  const data = await getOwnFollowUpView(session.user.id);
  if (!data) redirect("/sogp/enrol");
  if (data.request?.status !== "pending") redirect("/dashboard/sogp/follow-up");
  return <FollowUpRequest data={data} />;
}
