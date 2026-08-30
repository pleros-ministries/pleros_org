"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { buildFirstCohortTrackSelection } from "@/lib/sogp/first-cohort";
import {
  assertMondayCohortStart,
  buildSogpTrackReleaseDates,
} from "@/lib/sogp/schedule";
import {
  normalizeSogpPreparationInput,
  type SogpPreparationInput,
} from "@/lib/sogp/preparation-admin";
import {
  buildPreSogpSeed,
  isSogpLessonContentReady,
  validateSogpLaunchReadiness,
} from "@/lib/sogp/preparation-seed";
import {
  setPreparationLessonComplete,
  setSogpMorningPrayerComplete,
  setSogpReviewComplete,
} from "@/lib/db/queries/sogp-journey";
import {
  normalizeSogpBroadcast,
  sendSogpChannelMessage,
  type SogpBroadcastKind,
} from "@/lib/telegram/sogp-broadcast";

export async function sendAdminSogpBroadcast(input: {
  kind: SogpBroadcastKind;
  message: string;
}) {
  await requireAdmin();
  const normalized = normalizeSogpBroadcast(input);
  return sendSogpChannelMessage(normalized);
}

export async function configureSogpTelegramWebhook() {
  await requireAdmin();
  const token = process.env.TELEGRAM_SOGP_BOT_TOKEN;
  const secret = process.env.TELEGRAM_SOGP_WEBHOOK_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!token || !secret || !baseUrl?.startsWith("https://")) {
    throw new Error(
      "Telegram token, webhook secret, and HTTPS NEXT_PUBLIC_APP_URL are required.",
    );
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${baseUrl.replace(/\/$/, "")}/api/telegram/sogp/webhook`,
      secret_token: secret,
      allowed_updates: ["message"],
    }),
  });
  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
  };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? "Telegram webhook setup failed.");
  }
  return { configured: true };
}

export async function configureSogpCurriculum(input: {
  cohortId: number;
}) {
  await requireAdmin();
  const selection = buildFirstCohortTrackSelection();
  const cohort = await db.query.sogpCohorts.findFirst({
    where: (row, { eq: equal }) => equal(row.id, input.cohortId),
  });
  if (!cohort) throw new Error("SOGP cohort not found.");

  const candidates = await db
    .select()
    .from(schema.lessons)
    .where(inArray(schema.lessons.levelId, [1, 2, 3]));
  const selectedLessons = selection.map((selected) => {
    const lesson = candidates.find(
      (candidate) =>
        candidate.levelId === selected.levelId &&
        candidate.lessonNumber === selected.lessonNumber,
    );
    if (!lesson) {
      throw new Error(
        `Missing Level ${selected.levelId}.${selected.lessonNumber}.`,
      );
    }
    return { selected, lesson };
  });
  const quizRows = await db
    .select({ lessonId: schema.quizQuestions.lessonId })
    .from(schema.quizQuestions)
    .where(
      inArray(
        schema.quizQuestions.lessonId,
        selectedLessons.map(({ lesson }) => lesson.id),
      ),
    );
  const quizLessonIds = new Set(quizRows.map((row) => row.lessonId));
  const unready = selectedLessons.filter(
    ({ lesson }) =>
      !isSogpLessonContentReady({
        ...lesson,
        hasQuiz: quizLessonIds.has(lesson.id),
      }),
  );
  if (unready.length) {
    throw new Error(
      `Content not ready: ${unready.map(({ lesson }) => `L${lesson.levelId}.${lesson.lessonNumber} ${lesson.title}`).join(", ")}`,
    );
  }

  const firstRelease = new Date(cohort.startsAt);
  firstRelease.setUTCHours(5, 0, 0, 0);
  assertMondayCohortStart(firstRelease);
  const releaseDates = buildSogpTrackReleaseDates(firstRelease);

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.sogpCohortTracks)
      .where(eq(schema.sogpCohortTracks.cohortId, input.cohortId));
    await tx.insert(schema.sogpCohortTracks).values(
      selectedLessons.map(({ selected, lesson }) => ({
        cohortId: input.cohortId,
        lessonId: lesson.id,
        dayNumber: selected.dayNumber,
        weekNumber: selected.weekNumber,
        curriculumLevel: selected.curriculumLevel,
        curriculumOrder: selected.curriculumOrder,
        isRequired: selected.isRequired,
        liveSessionNumber: selected.liveSessionNumber,
        releaseAt: releaseDates[selected.curriculumOrder - 1]!,
      })),
    );
  });

  revalidatePath("/admin/sogp");

  return {
    requiredTrackCount: selection.length,
  };
}

export async function updateSogpCohort(input: {
  cohortId: number;
  status?: (typeof schema.sogpCohorts.$inferSelect)["status"];
  startsAt?: string;
  endsAt?: string;
  telegramChannelUrl?: string | null;
  telegramDiscussionUrl?: string | null;
}) {
  await requireAdmin();
  const currentCohort = await db.query.sogpCohorts.findFirst({
    where: (row, { eq: equal }) => equal(row.id, input.cohortId),
  });
  if (!currentCohort) throw new Error("SOGP cohort not found.");
  const startsAt = input.startsAt ? new Date(input.startsAt) : currentCohort.startsAt;
  const endsAt = input.endsAt ? new Date(input.endsAt) : currentCohort.endsAt;
  if (
    Number.isNaN(startsAt.getTime()) ||
    Number.isNaN(endsAt.getTime()) ||
    endsAt <= startsAt
  ) {
    throw new Error("Enter a valid cohort start and end date.");
  }
  assertMondayCohortStart(startsAt);
  if (input.status === "active") {
    const [preparationRows, trackRows, reviewRows, quizRows] = await Promise.all([
      db
        .select({
          dayId: schema.sogpPreparationDays.id,
          url: schema.sogpPreparationResources.url,
        })
        .from(schema.sogpPreparationDays)
        .innerJoin(
          schema.sogpPreparationResources,
          eq(
            schema.sogpPreparationResources.preparationDayId,
            schema.sogpPreparationDays.id,
          ),
        )
        .where(eq(schema.sogpPreparationDays.cohortId, input.cohortId)),
      db
        .select({ track: schema.sogpCohortTracks, lesson: schema.lessons })
        .from(schema.sogpCohortTracks)
        .innerJoin(
          schema.lessons,
          eq(schema.sogpCohortTracks.lessonId, schema.lessons.id),
        )
        .where(eq(schema.sogpCohortTracks.cohortId, input.cohortId)),
      db
        .select({ id: schema.sogpLiveClasses.id })
        .from(schema.sogpLiveClasses)
        .where(
          and(
            eq(schema.sogpLiveClasses.cohortId, input.cohortId),
            eq(schema.sogpLiveClasses.isRequired, true),
          ),
        ),
      db
        .select({ lessonId: schema.quizQuestions.lessonId })
        .from(schema.quizQuestions),
    ]);
    const lessonsWithQuiz = new Set(quizRows.map((row) => row.lessonId));
    const readinessIssues = validateSogpLaunchReadiness({
      preparationCount: new Set(preparationRows.map((row) => row.dayId)).size,
      uniquePreparationUrlCount: new Set(preparationRows.map((row) => row.url)).size,
      readyTrackCount: trackRows.filter(
        ({ track, lesson }) =>
          track.isRequired &&
          isSogpLessonContentReady({
            ...lesson,
            hasQuiz: lessonsWithQuiz.has(lesson.id),
          }),
      ).length,
      requiredReviewCount: reviewRows.length,
    });
    if (readinessIssues.length) throw new Error(readinessIssues.join(" "));
  }
  const [updated] = await db
    .update(schema.sogpCohorts)
    .set({
      ...(input.status ? { status: input.status } : {}),
      ...(input.startsAt ? { startsAt } : {}),
      ...(input.endsAt ? { endsAt } : {}),
      ...(input.telegramChannelUrl !== undefined
        ? { telegramChannelUrl: input.telegramChannelUrl }
        : {}),
      ...(input.telegramDiscussionUrl !== undefined
        ? { telegramDiscussionUrl: input.telegramDiscussionUrl }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.sogpCohorts.id, input.cohortId))
    .returning();
  if (!updated) throw new Error("SOGP cohort not found.");
  revalidatePath("/admin/sogp");
  return updated;
}

export async function seedSogpPreparation(input: { cohortId: number }) {
  await requireAdmin();
  const cohort = await db.query.sogpCohorts.findFirst({
    where: (row, { eq: equal }) => equal(row.id, input.cohortId),
  });
  if (!cohort) throw new Error("SOGP cohort not found.");
  const seed = buildPreSogpSeed(cohort.startsAt);

  await db.transaction(async (tx) => {
    for (const item of seed) {
      const [day] = await tx
        .insert(schema.sogpPreparationDays)
        .values({
          cohortId: input.cohortId,
          publishDate: item.publishDate,
          countdownLabel: item.countdownLabel,
          introduction: item.introduction,
          status: "published",
        })
        .onConflictDoUpdate({
          target: [
            schema.sogpPreparationDays.cohortId,
            schema.sogpPreparationDays.publishDate,
          ],
          set: {
            countdownLabel: item.countdownLabel,
            introduction: item.introduction,
            status: "published",
            updatedAt: new Date(),
          },
        })
        .returning({ id: schema.sogpPreparationDays.id });
      if (!day) throw new Error("Pre-SOGP seed could not be saved.");
      await tx
        .delete(schema.sogpPreparationResources)
        .where(eq(schema.sogpPreparationResources.preparationDayId, day.id));
      await tx.insert(schema.sogpPreparationResources).values({
        preparationDayId: day.id,
        type: "video",
        title: item.title,
        description: item.introduction,
        url: item.url,
        sortOrder: 0,
      });
    }
  });
  revalidatePath("/admin/sogp");
  return { count: seed.length };
}

export async function saveSogpPreparationDay(input: SogpPreparationInput) {
  await requireAdmin();
  const normalized = normalizeSogpPreparationInput(input);
  const cohort = await db.query.sogpCohorts.findFirst({
    where: (row, { eq: equal }) => equal(row.id, normalized.cohortId),
  });
  if (!cohort) throw new Error("SOGP cohort not found.");

  return db.transaction(async (tx) => {
    const [day] = normalized.id
      ? await tx
          .update(schema.sogpPreparationDays)
          .set({
            publishDate: normalized.publishDate,
            countdownLabel: normalized.countdownLabel,
            introduction: normalized.introduction,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.sogpPreparationDays.id, normalized.id),
              eq(schema.sogpPreparationDays.cohortId, normalized.cohortId),
            ),
          )
          .returning()
      : await tx
          .insert(schema.sogpPreparationDays)
          .values({
            cohortId: normalized.cohortId,
            publishDate: normalized.publishDate,
            countdownLabel: normalized.countdownLabel,
            introduction: normalized.introduction,
          })
          .returning();
    if (!day) throw new Error("Preparation day could not be saved.");

    await tx
      .delete(schema.sogpPreparationResources)
      .where(eq(schema.sogpPreparationResources.preparationDayId, day.id));
    await tx.insert(schema.sogpPreparationResources).values(
      normalized.resources.map((resource) => ({
        preparationDayId: day.id,
        ...resource,
      })),
    );
    return { id: day.id };
  });
}

export async function setSogpPreparationStatus(input: {
  id: number;
  status: "draft" | "published";
}) {
  await requireAdmin();
  const [updated] = await db
    .update(schema.sogpPreparationDays)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(schema.sogpPreparationDays.id, input.id))
    .returning({ id: schema.sogpPreparationDays.id });
  if (!updated) throw new Error("Preparation day not found.");
  return updated;
}

export async function deleteSogpPreparationDay(input: { id: number }) {
  await requireAdmin();
  const [deleted] = await db
    .delete(schema.sogpPreparationDays)
    .where(eq(schema.sogpPreparationDays.id, input.id))
    .returning({ id: schema.sogpPreparationDays.id });
  if (!deleted) throw new Error("Preparation day not found.");
  return deleted;
}

export async function createSogpLiveClass(input: {
  cohortId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  youtubeLiveUrl?: string | null;
  recordingUrl?: string | null;
  isRequired?: boolean;
}) {
  await requireAdmin();
  const title = input.title.trim();
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  if (!title || Number.isNaN(startsAt.getTime()) || endsAt <= startsAt) {
    throw new Error("Enter a title and valid class time range.");
  }
  const [created] = await db
    .insert(schema.sogpLiveClasses)
    .values({
      cohortId: input.cohortId,
      title,
      startsAt,
      endsAt,
      youtubeLiveUrl: input.youtubeLiveUrl?.trim() || null,
      recordingUrl: input.recordingUrl?.trim() || null,
      isRequired: input.isRequired ?? true,
    })
    .returning();
  revalidatePath("/admin/sogp");
  return created;
}

export async function updateSogpLiveClass(input: {
  id: number;
  youtubeLiveUrl?: string | null;
  recordingUrl?: string | null;
  isRequired?: boolean;
}) {
  await requireAdmin();
  const [updated] = await db
    .update(schema.sogpLiveClasses)
    .set({
      ...(input.youtubeLiveUrl !== undefined
        ? { youtubeLiveUrl: input.youtubeLiveUrl?.trim() || null }
        : {}),
      ...(input.recordingUrl !== undefined
        ? { recordingUrl: input.recordingUrl?.trim() || null }
        : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.sogpLiveClasses.id, input.id))
    .returning();
  if (!updated) throw new Error("SOGP review session not found.");
  revalidatePath("/admin/sogp");
  return updated;
}

async function requireSogpEnrollmentForCorrection(enrollmentId: number) {
  const enrollment = await db.query.sogpEnrollments.findFirst({
    where: (row, { eq: equal }) => equal(row.id, enrollmentId),
  });
  if (!enrollment) throw new Error("SOGP enrolment not found.");
  return enrollment;
}

export async function correctSogpPreparationCompletion(input: {
  enrollmentId: number;
  preparationDayId: number;
  complete: boolean;
}) {
  await requireAdmin();
  const enrollment = await requireSogpEnrollmentForCorrection(input.enrollmentId);
  const result = await setPreparationLessonComplete({
    userId: enrollment.userId,
    preparationDayId: input.preparationDayId,
    complete: input.complete,
  });
  revalidatePath("/admin/sogp");
  return result;
}

export async function correctSogpPrayerCompletion(input: {
  enrollmentId: number;
  dateKey: string;
  complete: boolean;
}) {
  await requireAdmin();
  const enrollment = await requireSogpEnrollmentForCorrection(input.enrollmentId);
  const result = await setSogpMorningPrayerComplete({
    userId: enrollment.userId,
    dateKey: input.dateKey,
    complete: input.complete,
  });
  revalidatePath("/admin/sogp");
  return result;
}

export async function correctSogpReviewCompletion(input: {
  enrollmentId: number;
  liveClassId: number;
  complete: boolean;
  source: "live" | "recording";
}) {
  await requireAdmin();
  const enrollment = await requireSogpEnrollmentForCorrection(input.enrollmentId);
  const result = await setSogpReviewComplete({
    userId: enrollment.userId,
    liveClassId: input.liveClassId,
    complete: input.complete,
    source: input.source,
  });
  revalidatePath("/admin/sogp");
  return result;
}

export async function markSogpLiveClassAttendance(input: {
  liveClassId: number;
  userIds: string[];
}) {
  await requireAdmin();
  if (!input.userIds.length) return { count: 0 };
  await db
    .insert(schema.sogpLiveClassAttendance)
    .values(
      input.userIds.map((userId) => ({
        liveClassId: input.liveClassId,
        userId,
      })),
    )
    .onConflictDoNothing();
  const rows = await db
    .select({ userId: schema.sogpLiveClassAttendance.userId })
    .from(schema.sogpLiveClassAttendance)
    .where(
      and(
        eq(schema.sogpLiveClassAttendance.liveClassId, input.liveClassId),
        inArray(schema.sogpLiveClassAttendance.userId, input.userIds),
      ),
    );
  return { count: rows.length };
}
