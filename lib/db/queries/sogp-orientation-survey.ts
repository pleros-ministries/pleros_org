import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { validateOrientationSurvey } from "@/lib/sogp/orientation-survey";

import * as schema from "../schema";

async function getEnrollmentId(userId: string) {
  const [row] = await db
    .select({ id: schema.sogpEnrollments.id })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(asc(schema.sogpEnrollments.createdAt))
    .limit(1);
  return row?.id ?? null;
}

export async function submitOrientationSurvey(
  userId: string,
  input: { reasons: string[]; question?: string | null },
): Promise<{ error: string } | { ok: true }> {
  const enrollmentId = await getEnrollmentId(userId);
  if (!enrollmentId) {
    return { error: "No SOGP enrolment found for this account." };
  }

  const { errors, question } = validateOrientationSurvey(input);
  if (errors.reasons || errors.question) {
    return { error: errors.reasons ?? errors.question ?? "Invalid submission." };
  }

  const [existing] = await db
    .select({ id: schema.sogpOrientationSurveys.id })
    .from(schema.sogpOrientationSurveys)
    .where(eq(schema.sogpOrientationSurveys.enrollmentId, enrollmentId))
    .limit(1);
  if (existing) return { ok: true };

  await db.insert(schema.sogpOrientationSurveys).values({
    enrollmentId,
    userId,
    reasons: Array.from(new Set(input.reasons)),
    question,
  });

  return { ok: true };
}
