import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getLeadMakeUpContext } from "@/lib/db/queries/sogp-review-makeups";
import { GroupReviewMakeUpOffer } from "@/components/sogp/group-review-make-up-offer";
export default async function MakeUpOfferPage({params}:{params:Promise<{reviewId:string}>}) {
  const session=await getAppSession();if(!session)redirect("/login?returnTo=/dashboard/sogp/reviews");
  const {reviewId}=await params;
  const data=/^\d{1,9}$/.test(reviewId)?await getLeadMakeUpContext(session.user.id,Number(reviewId)):null;
  if(!data)return <section className="mx-auto max-w-xl px-4 py-6"><h1>Review not available</h1><p className="mt-3 text-sm text-(--color-text-muted)">Only this active group’s lead can offer and confirm its replacements.</p><Link href="/dashboard/sogp/reviews" className="mt-4 inline-flex min-h-11 items-center text-sm text-(--color-brand-blue)">Back to group reviews</Link></section>;
  return <GroupReviewMakeUpOffer data={data} />;
}
