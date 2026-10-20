import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnAttendanceSheet, getReviewGroups } from "@/lib/db/queries/sogp-group-reviews";
import { GroupReviewSchedule } from "@/components/sogp/group-review-schedule";
import { rescheduleGroupReview, scheduleGroupReview } from "@/app/_actions/sogp-group-review-actions";

// Reads the session on every request (Cache Components).
export const instant = false;

const lagosDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" });
const lagosClock = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit", hour12: false });

export default async function RescheduleReviewPage({ params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/reviews");
  const { reviewId } = await params;
  if (!/^\d{1,9}$/.test(reviewId)) notFound();
  const [sheet, groups] = await Promise.all([getOwnAttendanceSheet(session.user.id, Number(reviewId)), getReviewGroups(session.user.id)]);
  if (!sheet) notFound();
  const led = groups.find(group => group.id === sheet.groupId && group.isLeader);
  if (!led || new Date(sheet.startsAt) <= new Date()) notFound();
  const startsAt = new Date(sheet.startsAt);
  return <GroupReviewSchedule
    groups={[{ id: led.id, name: led.name, leaderName: sheet.leaderName }]}
    schedule={scheduleGroupReview}
    initial={{ reviewId: sheet.id, groupId: led.id, title: sheet.title, date: lagosDate.format(startsAt), startTime: lagosClock.format(startsAt), endTime: lagosClock.format(new Date(sheet.endsAt)), venue: sheet.venue }}
    reschedule={rescheduleGroupReview}
  />;
}
