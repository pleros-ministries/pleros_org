import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnAttendanceSheet } from "@/lib/db/queries/sogp-group-reviews";
import { GroupReviewAttendance } from "@/components/sogp/group-review-attendance";

// Reads the session on every request (Cache Components).
export const instant = false;
export default async function ReviewAttendancePage({ params }: { params: Promise<{ reviewId: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/reviews");
  const { reviewId } = await params;
  const data = /^\d{1,9}$/.test(reviewId) ? await getOwnAttendanceSheet(session.user.id, Number(reviewId)) : null;
  if (!data) return <section className="mx-auto max-w-xl px-4 py-6"><h1>Review not available</h1><p className="mt-3 text-sm text-(--color-text-muted)">Only this active group’s lead can confirm its attendance.</p><Link href="/dashboard/sogp/reviews" className="mt-4 inline-flex min-h-9 items-center text-sm text-(--color-brand-blue)">Back to group reviews</Link></section>;
  return <GroupReviewAttendance data={data} />;
}
