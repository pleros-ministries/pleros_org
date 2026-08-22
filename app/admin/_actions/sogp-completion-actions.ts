"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getSogpCompletionForEnrollment } from "@/lib/db/queries/sogp-completion";
import { SOGP_REWARDS } from "@/lib/sogp/rewards";

export async function issueSogpCertificate(input: {
  enrollmentId: number;
  overrideReason?: string;
}) {
  const session = await requireAdmin();
  const completion = await getSogpCompletionForEnrollment(input.enrollmentId);
  if (!completion) throw new Error("SOGP enrolment not found.");
  const overrideReason = input.overrideReason?.trim() || null;
  if (!completion.eligibility.eligible && !overrideReason) {
    throw new Error(
      `Learner is not eligible: ${completion.eligibility.unmet.join(", ")}.`,
    );
  }
  const verificationCode = `SOGP-${randomBytes(6).toString("hex").toUpperCase()}`;
  const [certificate] = await db
    .insert(schema.sogpCertificates)
    .values({
      enrollmentId: input.enrollmentId,
      verificationCode,
      issuedBy: session.user.id,
      overrideReason,
    })
    .onConflictDoNothing({
      target: schema.sogpCertificates.enrollmentId,
    })
    .returning();
  await db
    .update(schema.sogpEnrollments)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(schema.sogpEnrollments.id, input.enrollmentId));
  await db
    .insert(schema.sogpRewardGrants)
    .values({
      enrollmentId: input.enrollmentId,
      rewardKey: "completion_certificate",
      label: SOGP_REWARDS.completion_certificate,
      grantedBy: session.user.id,
    })
    .onConflictDoNothing();
  return certificate ?? completion.dashboard.certificate;
}

export async function grantSogpReward(input: {
  enrollmentId: number;
  rewardKey: keyof typeof SOGP_REWARDS;
}) {
  const session = await requireAdmin();
  const label = SOGP_REWARDS[input.rewardKey];
  if (!label) throw new Error("Unknown SOGP reward.");
  const [grant] = await db
    .insert(schema.sogpRewardGrants)
    .values({
      enrollmentId: input.enrollmentId,
      rewardKey: input.rewardKey,
      label,
      grantedBy: session.user.id,
    })
    .onConflictDoNothing()
    .returning();
  return grant ?? null;
}
