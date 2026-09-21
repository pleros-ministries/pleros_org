import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { ensureSogpReferralCode } from "@/lib/db/queries/sogp-referrals";
import { buildReferralUrl } from "@/lib/sogp/referral";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";
import {
  DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE,
  isLearningProgressShareTemplate,
  validateLearningProgressQuote,
  type LearningProgressShareTemplate,
} from "@/lib/sogp/learning-progress-share";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

import * as schema from "../schema";

async function getLatestEnrollment(userId: string) {
  const [row] = await db
    .select({
      id: schema.sogpEnrollments.id,
      cohortId: schema.sogpEnrollments.cohortId,
      name: schema.sogpEnrollments.name,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(schema.sogpEnrollments.createdAt)
    .limit(1);
  return row ?? null;
}

async function getCurrentDayNumberForCohort(cohortId: number): Promise<number | null> {
  const rows = await db
    .select({
      dayNumber: schema.sogpCohortTracks.dayNumber,
      releaseAt: schema.sogpCohortTracks.releaseAt,
    })
    .from(schema.sogpCohortTracks)
    .where(
      and(
        eq(schema.sogpCohortTracks.cohortId, cohortId),
        eq(schema.sogpCohortTracks.isRequired, true),
      ),
    );
  const todayKey = toLagosDateKey(new Date());
  const match = rows.find(
    (row) => row.dayNumber != null && toLagosDateKey(row.releaseAt) === todayKey,
  );
  return match?.dayNumber ?? null;
}

async function getLessonTitleForDay(
  cohortId: number,
  dayNumber: number,
): Promise<string | null> {
  const [row] = await db
    .select({ title: schema.lessons.title })
    .from(schema.sogpCohortTracks)
    .innerJoin(
      schema.lessons,
      eq(schema.sogpCohortTracks.lessonId, schema.lessons.id),
    )
    .where(
      and(
        eq(schema.sogpCohortTracks.cohortId, cohortId),
        eq(schema.sogpCohortTracks.dayNumber, dayNumber),
      ),
    )
    .limit(1);
  return row?.title ?? null;
}

export async function createLearningProgressShare(
  userId: string,
  input: {
    track: "sogp" | "pre_sogp";
    dayNumber?: number | null;
    quote: string;
    template?: string | null;
  },
): Promise<
  | { error: string }
  | {
      id: number;
      quote: string;
      authorName: string;
      track: "sogp" | "pre_sogp";
      referralUrl: string;
      template: LearningProgressShareTemplate;
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

  const template = isLearningProgressShareTemplate(input.template)
    ? input.template
    : DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE;

  // The caller doesn't always know which day it is (e.g. the generic "Share
  // your progress" entry points have no specific lesson in context) — fall
  // back to today's scheduled day for the learner's cohort, the same way the
  // dashboard resolves "today" (see getActiveSogpJourney).
  const effectiveDayNumber =
    input.track === "sogp"
      ? (input.dayNumber ?? (await getCurrentDayNumberForCohort(enrollment.cohortId)))
      : (input.dayNumber ?? null);

  const lessonTitle =
    input.track === "sogp" && effectiveDayNumber
      ? await getLessonTitleForDay(enrollment.cohortId, effectiveDayNumber)
      : null;

  const [row] = await db
    .insert(schema.sogpLearningProgressShares)
    .values({
      enrollmentId: enrollment.id,
      userId,
      track: input.track,
      dayNumber: effectiveDayNumber,
      quote,
      authorName: enrollment.name,
      template,
      lessonTitle,
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
    template,
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
      dayNumber: schema.sogpLearningProgressShares.dayNumber,
      quote: schema.sogpLearningProgressShares.quote,
      authorName: schema.sogpLearningProgressShares.authorName,
      template: schema.sogpLearningProgressShares.template,
      lessonTitle: schema.sogpLearningProgressShares.lessonTitle,
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
