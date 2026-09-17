import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { ensureSogpReferralCode } from "@/lib/db/queries/sogp-referrals";
import { buildReferralUrl } from "@/lib/sogp/referral";
import { validateLearningProgressQuote } from "@/lib/sogp/learning-progress-share";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

import * as schema from "../schema";

async function getLatestEnrollment(userId: string) {
  const [row] = await db
    .select({
      id: schema.sogpEnrollments.id,
      name: schema.sogpEnrollments.name,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(schema.sogpEnrollments.createdAt)
    .limit(1);
  return row ?? null;
}

export async function createLearningProgressShare(
  userId: string,
  input: {
    track: "sogp" | "pre_sogp";
    dayNumber?: number | null;
    quote: string;
  },
): Promise<
  | { error: string }
  | {
      id: number;
      quote: string;
      authorName: string;
      track: "sogp" | "pre_sogp";
      referralUrl: string;
    }
> {
  const enrollment = await getLatestEnrollment(userId);
  if (!enrollment) {
    return { error: "No SOGP enrolment found for this account." };
  }

  const { error, quote } = validateLearningProgressQuote(input.quote);
  if (error || !quote) {
    return { error: error ?? "Invalid submission." };
  }

  const [row] = await db
    .insert(schema.sogpLearningProgressShares)
    .values({
      enrollmentId: enrollment.id,
      userId,
      track: input.track,
      dayNumber: input.dayNumber ?? null,
      quote,
      authorName: enrollment.name,
    })
    .returning({ id: schema.sogpLearningProgressShares.id });

  if (!row) {
    return { error: "Could not save your reflection." };
  }

  const referralCode = await ensureSogpReferralCode(enrollment.id);
  const referralUrl = buildReferralUrl(
    resolvePublicSiteUrl(process.env),
    referralCode,
  );

  return {
    id: row.id,
    quote,
    authorName: enrollment.name,
    track: input.track,
    referralUrl,
  };
}

export async function getLearningProgressShareForOwner(
  id: number,
  userId: string,
) {
  const [row] = await db
    .select({
      id: schema.sogpLearningProgressShares.id,
      userId: schema.sogpLearningProgressShares.userId,
      track: schema.sogpLearningProgressShares.track,
      quote: schema.sogpLearningProgressShares.quote,
      authorName: schema.sogpLearningProgressShares.authorName,
    })
    .from(schema.sogpLearningProgressShares)
    .where(
      and(
        eq(schema.sogpLearningProgressShares.id, id),
        eq(schema.sogpLearningProgressShares.userId, userId),
      ),
    )
    .limit(1);

  return row ?? null;
}
