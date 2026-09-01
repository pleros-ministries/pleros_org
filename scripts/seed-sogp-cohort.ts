import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../lib/db";
import * as schema from "../lib/db/schema";
import { buildFirstCohortTrackSelection } from "../lib/sogp/first-cohort";
import {
  assertMondayCohortStart,
  buildSogpTrackReleaseDates,
} from "../lib/sogp/schedule";

function argument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

const slug = argument("slug") ?? "september-2026";
const title = argument("title") ?? "SOGP September 2026";
const starts = argument("starts") ?? "2026-09-14";
const selection = buildFirstCohortTrackSelection();
const startsAt = new Date(`${starts}T00:00:00+01:00`);
if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid --starts date.");
assertMondayCohortStart(startsAt);
const endsAt = new Date(startsAt);
endsAt.setDate(endsAt.getDate() + 27);
endsAt.setHours(23, 59, 59, 999);

const lessons = await db
  .select()
  .from(schema.lessons)
  .where(inArray(schema.lessons.levelId, [1, 2, 3]))
  .orderBy(asc(schema.lessons.levelId), asc(schema.lessons.lessonNumber));
const selected = selection.map((item) => {
  const lesson = lessons.find(
    (candidate) =>
      candidate.levelId === item.levelId &&
      candidate.lessonNumber === item.lessonNumber,
  );
  if (!lesson) throw new Error(`Missing L${item.levelId}.${item.lessonNumber}.`);
  return { item, lesson };
});
const quizRows = await db
  .select({ lessonId: schema.quizQuestions.lessonId })
  .from(schema.quizQuestions)
  .where(
    inArray(
      schema.quizQuestions.lessonId,
      selected.map(({ lesson }) => lesson.id),
    ),
  );
const quizLessonIds = new Set(quizRows.map((row) => row.lessonId));
const missing = selected.filter(
  ({ lesson }) =>
    lesson.status !== "published" ||
    !lesson.audioUrl ||
    !lesson.notesContent ||
    !lesson.responsePrompt ||
    !lesson.responseMarkingGuide ||
    !quizLessonIds.has(lesson.id),
);
if (missing.length) {
  throw new Error(
    `Content not ready:\n${missing.map(({ lesson }) => `- L${lesson.levelId}.${lesson.lessonNumber} ${lesson.title}`).join("\n")}`,
  );
}

const [cohort] = await db
  .insert(schema.sogpCohorts)
  .values({
    slug,
    title,
    status: "enrollment_open",
    enrollmentOpensAt: new Date(),
    preparationStartsAt: new Date(),
    startsAt,
    endsAt,
    telegramBotUsername: process.env.TELEGRAM_SOGP_BOT_USERNAME ?? null,
  })
  .onConflictDoUpdate({
    target: schema.sogpCohorts.slug,
    set: { title, startsAt, endsAt, updatedAt: new Date() },
  })
  .returning();
if (!cohort) throw new Error("Cohort could not be created.");
const firstRelease = new Date(startsAt);
firstRelease.setUTCHours(5, 0, 0, 0);
const dates = buildSogpTrackReleaseDates(firstRelease);
await db.transaction(async (tx) => {
  await tx
    .delete(schema.sogpCohortTracks)
    .where(eq(schema.sogpCohortTracks.cohortId, cohort.id));
  await tx.insert(schema.sogpCohortTracks).values(
    selected.map(({ item, lesson }) => ({
      cohortId: cohort.id,
      lessonId: lesson.id,
      dayNumber: item.dayNumber,
      weekNumber: item.weekNumber,
      curriculumLevel: item.curriculumLevel,
      curriculumOrder: item.curriculumOrder,
      isRequired: item.isRequired,
      liveSessionNumber: item.liveSessionNumber,
      releaseAt: dates[item.curriculumOrder - 1]!,
    })),
  );
});

console.log(
  `Seeded ${cohort.title} with ${selection.length} required tracks.`,
);
