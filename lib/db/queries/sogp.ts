import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { deriveSogpLearnerState } from "@/lib/sogp/status";
import type {
  SogpDashboardData,
  SogpEnrollmentCreateInput,
} from "@/lib/sogp/types";

import * as schema from "../schema";

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export async function getOpenSogpCohort() {
  const [cohort] = await db
    .select()
    .from(schema.sogpCohorts)
    .where(
      inArray(schema.sogpCohorts.status, [
        "enrollment_open",
        "preparing",
      ]),
    )
    .orderBy(asc(schema.sogpCohorts.startsAt))
    .limit(1);

  return cohort ?? null;
}

export async function getSogpCohortBySlug(slug: string) {
  return (
    (await db.query.sogpCohorts.findFirst({
      where: (cohort, { eq: equal }) => equal(cohort.slug, slug),
    })) ?? null
  );
}

export async function getSogpEnrollmentByUserId(userId: string) {
  const [enrollment] = await db
    .select()
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);

  return enrollment ?? null;
}

export async function upsertSogpEnrollment(input: SogpEnrollmentCreateInput) {
  const now = new Date();
  const [enrollment] = await db
    .insert(schema.sogpEnrollments)
    .values({
      ...input,
      reason: input.reason || null,
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
      utmContent: input.utmContent || null,
      utmTerm: input.utmTerm || null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        schema.sogpEnrollments.cohortId,
        schema.sogpEnrollments.userId,
      ],
      set: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        country: input.country,
        reason: input.reason || null,
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
        utmContent: input.utmContent || null,
        utmTerm: input.utmTerm || null,
        updatedAt: now,
      },
    })
    .returning();

  if (!enrollment) throw new Error("SOGP enrolment could not be saved.");
  return enrollment;
}

export async function storeSogpTelegramLinkTokenHash(
  enrollmentId: number,
  tokenHash: string,
) {
  await db
    .update(schema.sogpEnrollments)
    .set({ telegramLinkTokenHash: tokenHash, updatedAt: new Date() })
    .where(eq(schema.sogpEnrollments.id, enrollmentId));
}

export async function linkSogpTelegramIdentity(input: {
  tokenHash: string;
  telegramUserId: string;
  telegramChatId: string;
}) {
  const [enrollment] = await db
    .update(schema.sogpEnrollments)
    .set({
      telegramUserId: input.telegramUserId,
      telegramChatId: input.telegramChatId,
      telegramLinkedAt: new Date(),
      telegramLinkTokenHash: null,
      updatedAt: new Date(),
    })
    .where(
      eq(schema.sogpEnrollments.telegramLinkTokenHash, input.tokenHash),
    )
    .returning();

  return enrollment ?? null;
}

function normalizeLearnerCohortStatus(
  status: (typeof schema.sogpCohorts.$inferSelect)["status"],
) {
  if (status === "active" || status === "completed") return status;
  return "preparing" as const;
}

export async function getSogpDashboardData(
  userId: string,
): Promise<SogpDashboardData | null> {
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
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);

  if (!row) return null;

  const [trackRows, liveClasses, attendanceRows, prayerRows, certificate, rewards] =
    await Promise.all([
      db
        .select({
          track: schema.sogpCohortTracks,
          lesson: schema.lessons,
          progress: schema.studentProgress,
        })
        .from(schema.sogpCohortTracks)
        .innerJoin(
          schema.lessons,
          eq(schema.sogpCohortTracks.lessonId, schema.lessons.id),
        )
        .leftJoin(
          schema.studentProgress,
          and(
            eq(schema.studentProgress.lessonId, schema.lessons.id),
            eq(schema.studentProgress.userId, userId),
          ),
        )
        .where(eq(schema.sogpCohortTracks.cohortId, row.cohort.id))
        .orderBy(asc(schema.sogpCohortTracks.dayNumber)),
      db
        .select()
        .from(schema.sogpLiveClasses)
        .where(eq(schema.sogpLiveClasses.cohortId, row.cohort.id))
        .orderBy(asc(schema.sogpLiveClasses.startsAt)),
      db
        .select({ count: count() })
        .from(schema.sogpLiveClassAttendance)
        .innerJoin(
          schema.sogpLiveClasses,
          eq(
            schema.sogpLiveClassAttendance.liveClassId,
            schema.sogpLiveClasses.id,
          ),
        )
        .where(
          and(
            eq(schema.sogpLiveClassAttendance.userId, userId),
            eq(schema.sogpLiveClasses.cohortId, row.cohort.id),
          ),
        ),
      db
        .select({ count: count() })
        .from(schema.prayerWatchAttendance)
        .where(
          and(
            eq(schema.prayerWatchAttendance.userId, userId),
            gte(
              schema.prayerWatchAttendance.attendedDate,
              dateKey(row.cohort.startsAt),
            ),
            lte(
              schema.prayerWatchAttendance.attendedDate,
              dateKey(row.cohort.endsAt),
            ),
          ),
        ),
      db.query.sogpCertificates.findFirst({
        where: (item, { eq: equal }) =>
          equal(item.enrollmentId, row.enrollment.id),
      }),
      db
        .select()
        .from(schema.sogpRewardGrants)
        .where(eq(schema.sogpRewardGrants.enrollmentId, row.enrollment.id))
        .orderBy(asc(schema.sogpRewardGrants.grantedAt)),
    ]);

  const tracks = trackRows.map(({ track, lesson, progress }) => {
    const normalizedProgress = {
      audioListened: progress?.audioListened ?? false,
      notesRead: progress?.notesRead ?? false,
      quizPassed: progress?.quizPassed ?? false,
      writtenApproved: progress?.writtenApproved ?? false,
    };
    return {
      id: track.id,
      dayNumber: track.dayNumber,
      weekNumber: track.weekNumber,
      releaseAt: track.releaseAt,
      lesson: {
        id: lesson.id,
        levelId: lesson.levelId,
        lessonNumber: lesson.lessonNumber,
        title: lesson.title,
        audioUrl: lesson.audioUrl,
        notesContent: lesson.notesContent,
        responsePrompt: lesson.responsePrompt,
        status: lesson.status,
      },
      progress: normalizedProgress,
      completed: Object.values(normalizedProgress).every(Boolean),
    };
  });

  return {
    enrollment: {
      id: row.enrollment.id,
      userId: row.enrollment.userId,
      name: row.enrollment.name,
      email: row.enrollment.email,
      phone: row.enrollment.phone,
      country: row.enrollment.country,
      status: row.enrollment.status,
      telegramLinkedAt: row.enrollment.telegramLinkedAt,
    },
    cohort: {
      id: row.cohort.id,
      slug: row.cohort.slug,
      title: row.cohort.title,
      status: row.cohort.status,
      startsAt: row.cohort.startsAt,
      endsAt: row.cohort.endsAt,
      preparationStartsAt: row.cohort.preparationStartsAt,
      telegramChannelUrl: row.cohort.telegramChannelUrl,
      telegramDiscussionUrl: row.cohort.telegramDiscussionUrl,
      telegramBotUsername: row.cohort.telegramBotUsername,
      assessmentPolicy: row.cohort.assessmentPolicy,
    },
    learnerState: deriveSogpLearnerState({
      cohortStatus: normalizeLearnerCohortStatus(row.cohort.status),
      enrollmentStatus: row.enrollment.status,
    }),
    tracks,
    liveClasses,
    prayerDaysAttended: prayerRows[0]?.count ?? 0,
    liveClassesAttended: attendanceRows[0]?.count ?? 0,
    certificate: certificate
      ? {
          verificationCode: certificate.verificationCode,
          issuedAt: certificate.issuedAt,
          revokedAt: certificate.revokedAt,
        }
      : null,
    rewards: rewards.map((reward) => ({
      rewardKey: reward.rewardKey,
      label: reward.label,
      grantedAt: reward.grantedAt,
    })),
  };
}

export async function getSogpDayData(userId: string, dayNumber: number) {
  const dashboard = await getSogpDashboardData(userId);
  if (!dashboard) return null;
  const track = dashboard.tracks.find((item) => item.dayNumber === dayNumber);
  if (!track) return null;

  return {
    dashboard,
    track,
    previousDay: dashboard.tracks.find(
      (item) => item.dayNumber === dayNumber - 1,
    ) ?? null,
    nextDay:
      dashboard.tracks.find((item) => item.dayNumber === dayNumber + 1) ?? null,
  };
}

export async function getAdminSogpData() {
  const [cohorts, enrollments, tracks, liveClasses, certificates] =
    await Promise.all([
      db.select().from(schema.sogpCohorts).orderBy(desc(schema.sogpCohorts.startsAt)),
      db.select().from(schema.sogpEnrollments).orderBy(desc(schema.sogpEnrollments.createdAt)),
      db
        .select({ track: schema.sogpCohortTracks, lesson: schema.lessons })
        .from(schema.sogpCohortTracks)
        .innerJoin(
          schema.lessons,
          eq(schema.sogpCohortTracks.lessonId, schema.lessons.id),
        )
        .orderBy(asc(schema.sogpCohortTracks.dayNumber)),
      db.select().from(schema.sogpLiveClasses).orderBy(asc(schema.sogpLiveClasses.startsAt)),
      db.select().from(schema.sogpCertificates).orderBy(desc(schema.sogpCertificates.issuedAt)),
    ]);

  return { cohorts, enrollments, tracks, liveClasses, certificates };
}
