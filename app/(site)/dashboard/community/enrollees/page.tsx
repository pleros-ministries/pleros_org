import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { ensureSogpReferralCode } from "@/lib/db/queries/sogp-referrals";
import { listOwnEnrollees } from "@/lib/db/queries/sogp-follow-up-routes";
import { listOwnEnrolleeContacts } from "@/lib/db/queries/people-follow-ups";
import { buildReferralUrl } from "@/lib/sogp/referral";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import { EnrolleesList } from "@/components/community/people/people-lists";

export default async function MyEnrolleesPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/enrollees");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enrol");
  const [rows, code] = await Promise.all([listOwnEnrollees(session.user.id), ensureSogpReferralCode(enrollment.id).catch(() => null)]);
  // Follow-up owners see their own enrollees' numbers (user decision, 17 October).
  const contacts = await listOwnEnrolleeContacts(session.user.id, rows.map(row => row.enrollmentId));
  return <EnrolleesList rows={rows} contacts={Object.fromEntries(contacts)} referralUrl={code ? buildReferralUrl(resolvePublicSiteUrl(process.env), code) : null} />;
}
