"use server";

import { and, eq, inArray } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { buildFirstCohortTrackSelection } from "@/lib/sogp/first-cohort";
import { buildWeekdayReleaseDates } from "@/lib/sogp/schedule";
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
  levelThreeLessonNumbers: number[];
}) {
  await requireAdmin();
  const selection = buildFirstCohortTrackSelection(
    input.levelThreeLessonNumbers,
  );
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
      lesson.status !== "published" ||
      !lesson.audioUrl ||
      !lesson.notesContent ||
      !lesson.responsePrompt ||
      !lesson.responseMarkingGuide ||
      !quizLessonIds.has(lesson.id),
  );
  if (unready.length) {
    throw new Error(
      `Content not ready: ${unready.map(({ lesson }) => `L${lesson.levelId}.${lesson.lessonNumber} ${lesson.title}`).join(", ")}`,
    );
  }

  const firstRelease = new Date(cohort.startsAt);
  firstRelease.setUTCHours(5, 0, 0, 0);
  const releaseDates = buildWeekdayReleaseDates(firstRelease, 20);

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.sogpCohortTracks)
      .where(eq(schema.sogpCohortTracks.cohortId, input.cohortId));
    await tx.insert(schema.sogpCohortTracks).values(
      selectedLessons.map(({ selected, lesson }, index) => ({
        cohortId: input.cohortId,
        lessonId: lesson.id,
        dayNumber: selected.dayNumber,
        weekNumber: selected.weekNumber,
        releaseAt: releaseDates[index]!,
      })),
    );
  });

  return { trackCount: 20 };
}

export async function updateSogpCohort(input: {
  cohortId: number;
  status?: (typeof schema.sogpCohorts.$inferSelect)["status"];
  telegramChannelUrl?: string | null;
  telegramDiscussionUrl?: string | null;
}) {
  await requireAdmin();
  const [updated] = await db
    .update(schema.sogpCohorts)
    .set({
      ...(input.status ? { status: input.status } : {}),
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
  return updated;
}

export async function createSogpLiveClass(input: {
  cohortId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  youtubeLiveUrl?: string | null;
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
    })
    .returning();
  return created;
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
