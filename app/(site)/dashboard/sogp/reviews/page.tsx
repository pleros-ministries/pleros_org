import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getGroupReviewView } from "@/lib/db/queries/sogp-group-reviews";
import { GroupReviewList } from "@/components/sogp/group-review-list";

// Reads the session on every request (Cache Components).
export const instant = false;
export default async function ReviewsPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/reviews");
  const { group } = await searchParams;
  const groupId = group && /^\d{1,9}$/.test(group) ? Number(group) : undefined;
  const data = await getGroupReviewView(session.user.id, groupId);
  if (!data) redirect("/sogp/enrol");
  return <GroupReviewList data={data} />;
}
