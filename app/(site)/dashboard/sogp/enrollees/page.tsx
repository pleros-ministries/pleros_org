import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { ensureSogpReferralCode } from "@/lib/db/queries/sogp-referrals";
import { listOwnEnrollees } from "@/lib/db/queries/sogp-follow-up-routes";
import { buildReferralUrl } from "@/lib/sogp/referral";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import { MyEnrollees } from "@/components/sogp/follow-up-invitations";

export default async function MyEnrolleesPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/enrollees");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enrol");
  const [rows, code] = await Promise.all([listOwnEnrollees(session.user.id), ensureSogpReferralCode(enrollment.id).catch(() => null)]);
  return <MyEnrollees rows={rows} referralCode={code} referralUrl={code ? buildReferralUrl(resolvePublicSiteUrl(process.env), code) : null} />;
}
