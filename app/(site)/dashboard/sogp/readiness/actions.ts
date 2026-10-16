"use server";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getOwnCertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import { SOGP_REWARDS } from "@/lib/sogp/rewards";

/** Learner self-issuance. Gated on the same facts the readiness page displays; no overrides. */
export async function claimCertificate() {
  const session = await getAppSession();
  if (!session) return { ok: false as const, error: "Sign in to claim your certificate." };
  const [dashboard, facts] = await Promise.all([
    getSogpDashboardData(session.user.id),
    getOwnCertificationFacts(session.user.id),
  ]);
  if (!dashboard || !facts) return { ok: false as const, error: "Enrol in SOGP to claim a certificate." };
  if (facts.certificateAvailable) return { ok: true as const, alreadyIssued: true as const };
  if (!facts.meetsRequirements) return { ok: false as const, error: "You do not meet the certificate requirements yet." };
  const enrollmentId = dashboard.enrollment.id;
  const verificationCode = `SOGP-${randomBytes(6).toString("hex").toUpperCase()}`;
  await db
    .insert(schema.sogpCertificates)
    .values({ enrollmentId, verificationCode, issuedBy: session.user.id, overrideReason: null })
    .onConflictDoNothing({ target: schema.sogpCertificates.enrollmentId });
  await db
    .update(schema.sogpEnrollments)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(schema.sogpEnrollments.id, enrollmentId));
  await db
    .insert(schema.sogpRewardGrants)
    .values({
      enrollmentId,
      rewardKey: "completion_certificate",
      label: SOGP_REWARDS.completion_certificate,
      grantedBy: session.user.id,
    })
    .onConflictDoNothing();
  revalidatePath("/dashboard/sogp/readiness");
  revalidatePath("/dashboard/sogp/certificate");
  revalidatePath("/dashboard/sogp");
  return { ok: true as const, alreadyIssued: false as const };
}
