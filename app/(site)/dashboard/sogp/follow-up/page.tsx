import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnFollowUpView } from "@/lib/db/queries/sogp-follow-up-requests";
import { FollowUpRequest } from "@/components/sogp/follow-up-request";

export default async function FollowUpPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/follow-up");
  const data = await getOwnFollowUpView(session.user.id);
  if (!data) redirect("/sogp/enrol");
  if (data.request?.status === "pending") redirect("/dashboard/sogp/follow-up/request");
  return <FollowUpRequest data={data} />;
}
