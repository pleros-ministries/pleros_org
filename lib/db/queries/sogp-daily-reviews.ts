import { and, eq, gt } from "drizzle-orm";

import {
  buildDailyReviewSessions,
  DAILY_REVIEW_TITLE,
} from "../../sogp/daily-reviews";
import { db } from "./../index";
import * as schema from "../schema";

const SCHEDULED_STATUSES = ["enrollment_open", "preparing", "active"];

/**
 * Idempotently creates the required daily review sessions for a cohort and
 * points them at the cohort's Telegram channel. Sessions that already ended,
 * or already exist at the same start time, are skipped.
 */
export async function ensureDailyReviewSessions(
  cohortId: number,
  options: { dryRun?: boolean; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const [cohort] = await db
    .select()
    .from(schema.sogpCohorts)
    .where(eq(schema.sogpCohorts.id, cohortId))
    .limit(1);
  if (!cohort || !SCHEDULED_STATUSES.includes(cohort.status)) {
    return { created: 0, relinked: 0 };
  }

  const existing = await db
    .select({ startsAt: schema.sogpLiveClasses.startsAt })
    .from(schema.sogpLiveClasses)
    .where(eq(schema.sogpLiveClasses.cohortId, cohortId));
  const existingStarts = new Set(existing.map((row) => row.startsAt.getTime()));

  const missing = buildDailyReviewSessions({
    startsAt: cohort.startsAt,
    endsAt: cohort.endsAt,
    now,
  }).filter((session) => !existingStarts.has(session.startsAt.getTime()));

  if (options.dryRun) return { created: missing.length, relinked: 0 };

  if (missing.length) {
    await db.insert(schema.sogpLiveClasses).values(
      missing.map((session) => ({
        cohortId,
        title: DAILY_REVIEW_TITLE,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        youtubeLiveUrl: cohort.telegramChannelUrl,
        isRequired: true,
      })),
    );
  }

  let relinked = 0;
  if (cohort.telegramChannelUrl) {
    const updated = await db
      .update(schema.sogpLiveClasses)
      .set({ youtubeLiveUrl: cohort.telegramChannelUrl, updatedAt: now })
      .where(
        and(
          eq(schema.sogpLiveClasses.cohortId, cohortId),
          eq(schema.sogpLiveClasses.title, DAILY_REVIEW_TITLE),
          gt(schema.sogpLiveClasses.startsAt, now),
        ),
      )
      .returning({ id: schema.sogpLiveClasses.id });
    relinked = updated.length;
  }

  return { created: missing.length, relinked };
}
