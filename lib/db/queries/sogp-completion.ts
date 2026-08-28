import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { calculateSogpEligibility } from "@/lib/sogp/assessment";
import { getActiveSogpJourney } from "./sogp-journey";

export async function getSogpCompletionForEnrollment(enrollmentId: number) {
  const enrollment = await db.query.sogpEnrollments.findFirst({
    where: (row, { eq: equal }) => equal(row.id, enrollmentId),
  });
  if (!enrollment) return null;
  const dashboard = await import("./sogp").then(({ getSogpDashboardData }) =>
    getSogpDashboardData(enrollment.userId),
  );
  if (!dashboard || dashboard.enrollment.id !== enrollmentId) return null;
  const journey = await getActiveSogpJourney(enrollment.userId);
  if (!journey) return null;
  const eligibility = calculateSogpEligibility({
    completedTracks: journey.progress.coreCompleted,
    totalTracks: journey.progress.coreTotal,
    prayerDaysAttended: journey.progress.prayerCompleted,
    prayerDaysAvailable: journey.progress.prayerTotal,
    liveClassesAttended: journey.progress.reviewsCompleted,
    policy: dashboard.cohort.assessmentPolicy,
  });
  return { enrollment, dashboard, eligibility };
}

export async function getSogpCertificateByCode(verificationCode: string) {
  return (
    (await db.query.sogpCertificates.findFirst({
      where: (certificate, { eq: equal }) =>
        equal(certificate.verificationCode, verificationCode),
    })) ?? null
  );
}

export async function getSogpCertificateOwner(enrollmentId: number) {
  const [row] = await db
    .select({
      enrollment: schema.sogpEnrollments,
      cohort: schema.sogpCohorts,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpEnrollments.cohortId, schema.sogpCohorts.id),
    )
    .where(eq(schema.sogpEnrollments.id, enrollmentId))
    .limit(1);
  return row ?? null;
}
