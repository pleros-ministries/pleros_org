import { after } from "next/server";

import { assignEnrollmentToUnit } from "@/lib/db/queries/community-units";
import { autoAssignPastorForEnrollment } from "@/lib/db/queries/pastor-followups";
import {
  attributeSogpReferral,
  ensureSogpReferralCode,
} from "@/lib/db/queries/sogp-referrals";
import { sendSogpEnrollmentEmail } from "@/lib/email/send";
import { sendSogpSignupAlert } from "@/lib/telegram/sogp-signup-alert";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import { formatSogpReferralSource } from "./enrollment";
import type * as schema from "@/lib/db/schema";

const cohortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

export function formatCohortDates(startsAt: Date, endsAt: Date) {
  return `${cohortDateFormatter.format(startsAt)} – ${cohortDateFormatter.format(endsAt)}`;
}

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

  after(() =>
    attributeSogpReferral({
      enrolleeEnrollmentId: enrollment.id,
      enrolleeUserId: userId,
      code: values.referredByCode,
    }).catch((error) => console.error("SOGP referral attribution failed:", error)),
  );
  after(() =>
    ensureSogpReferralCode(enrollment.id).catch((error) =>
      console.error("SOGP referral code mint failed:", error),
    ),
  );
  after(() =>
    assignEnrollmentToUnit(enrollment.id)
      .then((result) =>
        result ? autoAssignPastorForEnrollment(enrollment.id, result.unitId) : null,
      )
      .catch((error) =>
        console.error("SOGP community unit/pastor assignment failed:", error),
      ),
  );
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
