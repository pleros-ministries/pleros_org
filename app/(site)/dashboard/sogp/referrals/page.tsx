import { redirect } from "next/navigation";

import { ShareReferral } from "@/components/sogp/share-referral";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { getSogpReferralsDashboard } from "@/lib/db/queries/sogp-referrals";

export default async function SogpReferralsPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/referrals");

  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enrol");

  const initialData = await getSogpReferralsDashboard(session.user.id);
  if (!initialData) redirect("/sogp/enrol");

  return <ShareReferral code={initialData.referralCode} url={initialData.referralUrl} referredCount={initialData.referredCount} />;
}
