import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";
import {
  buildReferralUrl,
  deriveReferralStage,
  generateReferralCode,
  type ReferralStage,
} from "@/lib/sogp/referral";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

function firstNameOf(value: string) {
  return value.trim().split(/\s+/)[0] || "Someone";
}

/**
 * Returns the enrolment's own referral code, minting one on first call. The
 * partial unique index on `referral_code` makes a colliding code raise 23505;
 * retry a few times before giving up.
 */
export async function ensureSogpReferralCode(
  enrollmentId: number,
): Promise<string> {
  const [existing] = await db
    .select({ code: schema.sogpEnrollments.referralCode })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.id, enrollmentId))
    .limit(1);
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateReferralCode();
    try {
      const [updated] = await db
        .update(schema.sogpEnrollments)
        .set({ referralCode: candidate, updatedAt: new Date() })
        .where(
          and(
            eq(schema.sogpEnrollments.id, enrollmentId),
            isNull(schema.sogpEnrollments.referralCode),
          ),
        )
        .returning({ code: schema.sogpEnrollments.referralCode });
      if (updated?.code) return updated.code;

      // The row already had a code (set concurrently) — read it back.
      const [row] = await db
        .select({ code: schema.sogpEnrollments.referralCode })
        .from(schema.sogpEnrollments)
        .where(eq(schema.sogpEnrollments.id, enrollmentId))
        .limit(1);
      if (row?.code) return row.code;
    } catch (error) {
      if ((error as { code?: string }).code !== "23505" || attempt === 4) {
        throw error;
      }
    }
  }
  throw new Error("Could not mint a referral code.");
}

/**
 * Records which enrolment referred `enrolleeEnrollmentId`. First-write-wins,
 * ignores empty/unknown codes and self-referral.
 */
export async function attributeSogpReferral(input: {
  enrolleeEnrollmentId: number;
  enrolleeUserId: string;
  code: string;
}): Promise<void> {
  const code = input.code.trim();
  if (!code) return;

  const [referrer] = await db
    .select({
      id: schema.sogpEnrollments.id,
      userId: schema.sogpEnrollments.userId,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.referralCode, code))
    .limit(1);
  if (!referrer || referrer.userId === input.enrolleeUserId) return;

  await db
    .update(schema.sogpEnrollments)
    .set({ referredByEnrollmentId: referrer.id, updatedAt: new Date() })
    .where(
      and(
        eq(schema.sogpEnrollments.id, input.enrolleeEnrollmentId),
        isNull(schema.sogpEnrollments.referredByEnrollmentId),
      ),
    );
}

export type ReferralsDashboardData = {
  referralCode: string;
  referralUrl: string;
  referredCount: number;
  preparationDaysTotal: number;
  referred: Array<{
    firstName: string;
    joinedAt: string;
    stage: ReferralStage;
    preparationDaysComplete: number;
  }>;
};

export async function getSogpReferralsDashboard(
  userId: string,
): Promise<ReferralsDashboardData | null> {
  const [head] = await db
    .select({ id: schema.sogpEnrollments.id })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);
  if (!head) return null;

  const referralCode = await ensureSogpReferralCode(head.id);

  const referredRows = await db
    .select({
      id: schema.sogpEnrollments.id,
      firstName: schema.sogpEnrollments.firstName,
      name: schema.sogpEnrollments.name,
      createdAt: schema.sogpEnrollments.createdAt,
      enrollmentStatus: schema.sogpEnrollments.status,
      cohortStatus: schema.sogpCohorts.status,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpEnrollments.cohortId, schema.sogpCohorts.id),
    )
    .where(eq(schema.sogpEnrollments.referredByEnrollmentId, head.id))
    .orderBy(asc(schema.sogpEnrollments.createdAt));

  const referredIds = referredRows.map((row) => row.id);
  const prepCounts = new Map<number, number>();
  if (referredIds.length > 0) {
    const rows = await db
      .select({
        enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
        completed: count(),
      })
      .from(schema.sogpPreparationCompletions)
      .where(
        inArray(schema.sogpPreparationCompletions.enrollmentId, referredIds),
      )
      .groupBy(schema.sogpPreparationCompletions.enrollmentId);
    for (const row of rows) prepCounts.set(row.enrollmentId, row.completed);
  }

  return {
    referralCode,
    referralUrl: buildReferralUrl(resolvePublicSiteUrl(process.env), referralCode),
    referredCount: referredRows.length,
    preparationDaysTotal: PRE_SOGP_PREPARATION_DAYS,
    referred: referredRows.map((row) => {
      const preparationDaysComplete = prepCounts.get(row.id) ?? 0;
      return {
        firstName: firstNameOf(row.firstName || row.name),
        joinedAt: row.createdAt.toISOString(),
        stage: deriveReferralStage({
          cohortStatus: row.cohortStatus,
          enrollmentStatus: row.enrollmentStatus,
          preparationDaysComplete,
        }),
        preparationDaysComplete,
      };
    }),
  };
}
