import { after } from "next/server";

import { assignEnrollmentToUnit } from "@/lib/db/queries/community-units";
import {
  assignReferralOwnerForEnrollment,
  autoAssignPastorForEnrollment,
} from "@/lib/db/queries/pastor-followups";
import { recordFollowUpRoute } from "@/lib/db/queries/sogp-follow-up-routes";
import { inviteReferredLearnerToOwnerGroup } from "@/lib/db/queries/sogp-group-invitations";
import {
  attributeSogpReferral,
  ensureSogpReferralCode,
} from "@/lib/db/queries/sogp-referrals";
import { sendSogpEnrollmentEmail } from "@/lib/email/send";
import { sendSogpSignupAlert } from "@/lib/telegram/sogp-signup-alert";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import { formatCohortDates } from "./cohort-dates";
import { formatSogpReferralSource } from "./enrollment";
import type * as schema from "@/lib/db/schema";

/**
 * Everything that should happen after a real `sogp_enrollments` row is
 * created, whether that's a first-time enrolment (`/complete`) or a
 * signed-in learner opting into a second cohort (`/join-cohort`). None of
 * this may fail the enrolment itself and none may race the response —
 * `after()` keeps the serverless function alive until each finishes.
 */
export function runSogpPostEnrollmentSideEffects(input: {
  enrollment: typeof schema.sogpEnrollments.$inferSelect;
  cohort: typeof schema.sogpCohorts.$inferSelect;
  userId: string;
  /** `pleros_discipleship_invite` cookie, when enrolment began from a group link. */
  groupInviteCode?: string | null;
  values: {
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    birthYear: string | number | null;
    referralSource: string;
    referralSourceOther: string;
    referredByCode: string;
    /** Absent on setup payloads saved before code/link tracking. */
    referredVia?: "link" | "code" | "";
  };
}) {
  const { enrollment, cohort, userId, values } = input;
  const birthYear =
    typeof values.birthYear === "string"
      ? values.birthYear
        ? Number(values.birthYear)
        : null
      : values.birthYear;
  const referralSource = formatSogpReferralSource({
    referralSource: values.referralSource,
    referralSourceOther: values.referralSourceOther,
  });

  // Referral first, then geography, in one sequence: running them as
  // separate tasks let whichever finished first claim the follow-up slot.
  after(async () => {
    const referrer = await attributeSogpReferral({
      enrolleeEnrollmentId: enrollment.id,
      enrolleeUserId: userId,
      code: values.referredByCode,
    }).catch((error) => {
      console.error("SOGP referral attribution failed:", error);
      return null;
    });
    await ensureSogpReferralCode(enrollment.id).catch((error) =>
      console.error("SOGP referral code mint failed:", error),
    );
    const unit = await assignEnrollmentToUnit(enrollment.id).catch((error) => {
      console.error("SOGP community unit assignment failed:", error);
      return null;
    });
    try {
      if (referrer) {
        if (await assignReferralOwnerForEnrollment(enrollment.id, referrer.userId)) {
          await recordFollowUpRoute({
            enrollmentId: enrollment.id,
            source: values.referredVia === "code" ? "code" : "link",
            ownerUserId: referrer.userId,
          });
        }
      } else if (unit) {
        const ownerUserId = await autoAssignPastorForEnrollment(enrollment.id, unit.unitId);
        if (ownerUserId) await recordFollowUpRoute({ enrollmentId: enrollment.id, source: "geography", ownerUserId });
      }
    } catch (error) {
      console.error("SOGP follow-up owner assignment failed:", error);
    }
    // A pending invitation only: the learner joins the referrer's group by accepting.
    if (referrer) {
      await inviteReferredLearnerToOwnerGroup({
        referrerEnrollmentId: referrer.enrollmentId,
        referrerUserId: referrer.userId,
        recipientEnrollmentId: enrollment.id,
        groupInviteCode: input.groupInviteCode,
      }).catch((error) => console.error("SOGP referral group invitation failed:", error));
    }
  });
  after(() =>
    sendSogpEnrollmentEmail({
      to: values.email,
      name: values.name,
      cohortTitle: cohort.title,
      cohortDates: formatCohortDates(cohort.startsAt, cohort.endsAt),
      dashboardUrl: `${resolvePublicSiteUrl(process.env)}/dashboard/welcomepack/join`,
    }).catch((error) => console.error("SOGP enrolment email failed:", error)),
  );
  after(() =>
    sendSogpSignupAlert({
      enrollmentId: enrollment.id,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      country: values.country,
      region: values.region,
      birthYear,
      referralSource,
      cohortTitle: cohort.title,
    }).catch((error) => console.error("SOGP signup Telegram alert failed:", error)),
  );
}
