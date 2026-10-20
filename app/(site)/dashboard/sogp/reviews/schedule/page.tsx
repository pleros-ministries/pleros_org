import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getReviewGroups } from "@/lib/db/queries/sogp-group-reviews";
import { GroupReviewSchedule } from "@/components/sogp/group-review-schedule";
import { scheduleGroupReview } from "@/app/_actions/sogp-group-review-actions";

// Reads the session on every request (Cache Components).
export const instant = false;
export default async function ScheduleReviewPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/reviews/schedule");
  const groups = await getReviewGroups(session.user.id);
  return <GroupReviewSchedule groups={groups.filter(group => group.isLeader)} schedule={scheduleGroupReview} />;
}
