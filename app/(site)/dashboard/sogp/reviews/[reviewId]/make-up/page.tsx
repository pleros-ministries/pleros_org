import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnMakeUpView } from "@/lib/db/queries/sogp-review-makeups";
import { GroupReviewMakeUp } from "@/components/sogp/group-review-make-up";
import { chooseReviewMakeup } from "@/app/_actions/sogp-group-review-actions";

// Reads the session on every request (Cache Components).
export const instant = false;
export default async function MakeUpPage({params}:{params:Promise<{reviewId:string}>}) {
  const session=await getAppSession();if(!session)redirect("/login?returnTo=/dashboard/sogp/reviews");
  const {reviewId}=await params;
  const data=/^\d{1,9}$/.test(reviewId)?await getOwnMakeUpView(session.user.id,Number(reviewId)):null;
  if(!data)return <section className="mx-auto max-w-xl px-4 py-6"><h1>Make-up not available</h1><p className="mt-3 text-sm text-(--color-text-muted)">Make-ups are linked to your own recorded missed review. Your learning and history are unchanged.</p><Link href="/dashboard/sogp/reviews" className="mt-4 inline-flex min-h-9 items-center text-sm text-(--color-brand-blue)">Back to group reviews</Link></section>;
  return <GroupReviewMakeUp data={data} choose={chooseReviewMakeup} />;
}
