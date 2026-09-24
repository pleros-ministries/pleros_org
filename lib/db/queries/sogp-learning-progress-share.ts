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

// Shared by createLearningProgressShare and getLearningProgressShareRenderContext:
// resolves the enrollment, the effective day number (falling back to today's
// scheduled day for the learner's cohort — the same way the dashboard
// resolves "today", see getActiveSogpJourney), and that day's lesson title.
async function resolveLearningProgressShareContext(
  userId: string,
  input: { track: "sogp" | "pre_sogp"; dayNumber?: number | null },
): Promise<
  | { error: string }
  | {
      enrollment: { id: number; cohortId: number; name: string };
      dayNumber: number | null;
      lessonTitle: string | null;
    }
> {
  const enrollment = await getLatestEnrollment(userId);
  if (!enrollment) {
    return { error: "No SOGP enrolment found for this account." };
  }

  const dayNumber =
    input.track === "sogp"
      ? (input.dayNumber ?? (await getCurrentDayNumberForCohort(enrollment.cohortId)))
      : (input.dayNumber ?? null);

  const lessonTitle =
    input.track === "sogp" && dayNumber
      ? await getLessonTitleForDay(enrollment.cohortId, dayNumber)
      : null;

  return { enrollment, dayNumber, lessonTitle };
}

export async function getLearningProgressShareRenderContext(
  userId: string,
  input: { track: "sogp" | "pre_sogp"; dayNumber?: number | null },
): Promise<
  | { error: string }
  | {
      authorName: string;
      track: "sogp" | "pre_sogp";
      dayNumber: number | null;
      lessonTitle: string | null;
    }
> {
  const context = await resolveLearningProgressShareContext(userId, input);
  if ("error" in context) return context;
  return {
    authorName: context.enrollment.name,
    track: input.track,
    dayNumber: context.dayNumber,
    lessonTitle: context.lessonTitle,
  };
}

export async function createLearningProgressShare(
  userId: string,
  input: {
    track: "sogp" | "pre_sogp";
    dayNumber?: number | null;
    quote: string;
    template?: string | null;
    kind?: "image" | "video";
  },
): Promise<
  | { error: string }
  | {
      id: number;
      quote: string | null;
      authorName: string;
      track: "sogp" | "pre_sogp";
      referralUrl: string;
      template: LearningProgressShareTemplate;
      kind: "image" | "video";
    }
> {
  const context = await resolveLearningProgressShareContext(userId, {
    track: input.track,
    dayNumber: input.dayNumber,
  });
  if ("error" in context) return context;
  const { enrollment, dayNumber: effectiveDayNumber, lessonTitle } = context;

  const kind = input.kind === "video" ? "video" : "image";

  // Video shares carry no typed quote — the learner speaks instead, so only
  // image shares require and validate one.
  let quote: string | null = null;
  if (kind === "image") {
    const validated = validateLearningProgressQuote(input.quote);
    if (validated.error || !validated.quote) {
      return { error: validated.error ?? "Invalid submission." };
    }
    quote = validated.quote;
  }

  const template = isLearningProgressShareTemplate(input.template)
    ? input.template
    : DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE;

  const [row] = await db
    .insert(schema.sogpLearningProgressShares)
    .values({
      enrollmentId: enrollment.id,
      userId,
      track: input.track,
      dayNumber: effectiveDayNumber,
      kind,
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
    kind,
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
      kind: schema.sogpLearningProgressShares.kind,
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
