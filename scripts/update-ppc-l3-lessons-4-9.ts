import { readFileSync } from "node:fs";
import { and, count, eq, inArray } from "drizzle-orm";

// Dynamic imports: tsx loads the static form as ESM and can't see the db module's named export.
// Dry run by default. `--apply` syncs the content; `--apply --publish` also releases the lessons;
// `--schedule=<cohort slug>` adds them to that cohort's SOGP Level 4 week (never moves existing rows).
const apply = process.argv.includes("--apply");
const publish = process.argv.includes("--publish");
const scheduleSlug = process.argv
  .find((value) => value.startsWith("--schedule="))
  ?.slice("--schedule=".length);

const LEVEL_ID = 3;
const SOGP_LEVEL = 4;
const SOURCE_DOC_PATH = "tmp/ppc-l3-lessons4-9-questions.txt";
const AUDIO_BASE = "https://res.cloudinary.com/v6emrxzj/video/upload";
// The seeded filler notes are not real teaching content; swap them for the L3.1 holding line.
const SEED_NOTES_PREFIX = "## Teaching Notes\n\nThis lesson covers foundational principles";
const HOLDING_NOTES = "<p>Transcripts would be uploaded soon.</p>";

const LESSONS = [
  {
    lessonNumber: 4,
    title: "The Life of Prayer",
    audioUrl: `${AUDIO_BASE}/v1791136008/9._The_Life_of_Prayer_-_8_Mar_2026.mp3`,
  },
  {
    lessonNumber: 5,
    title: "Believer’s Authority",
    audioUrl: `${AUDIO_BASE}/v1791136007/17._Believer_s_Authority_-_19_Apr_2026.mp3`,
  },
  {
    lessonNumber: 6,
    title: "Healing in the Newness of Life",
    audioUrl: `${AUDIO_BASE}/v1791136008/18._Healing_in_the_Newness_of_Life_-_26_Apr_2026.mp3`,
  },
  {
    lessonNumber: 7,
    title: "Natural Assignment in the Newness of Life",
    audioUrl: `${AUDIO_BASE}/v1791136009/22._Natural_Assignment_in_the_Newness_of_Life_-_24_May_2026.mp3`,
  },
  {
    lessonNumber: 8,
    title: "Spiritual Assignment in the Newness of Life",
    audioUrl: `${AUDIO_BASE}/v1791136008/23._Spiritual_Assignment_in_the_Newness_of_Life_-_24_May_2026.mp3`,
  },
  {
    lessonNumber: 9,
    title: "Supernatural in the Newness of Life",
    audioUrl: `${AUDIO_BASE}/v1791136007/19._Supernatural_in_the_Newness_of_Life_-_3_May_2026.mp3`,
  },
];

async function main() {
  const { db } = await import("../lib/db");
  const { transactionDb } = await import("../lib/db/transaction");
  const schema = await import("../lib/db/schema");
  const { parsePpcMcqDocument, parsePpcShortAnswerDocument } = await import(
    "../lib/ppc-content-import"
  );
  const { getLessonPublishReadiness } = await import("../lib/ppc-content-cms");
  const { buildFirstCohortTrackSelection } = await import("../lib/sogp/first-cohort");
  const { buildSogpTrackReleaseDates, resolveFirstReleaseAt } = await import(
    "../lib/sogp/schedule"
  );

  const source = readFileSync(SOURCE_DOC_PATH, "utf8");
  const lessonNumbers = LESSONS.map((lesson) => lesson.lessonNumber);
  const quizTracks = parsePpcMcqDocument(source, lessonNumbers);
  const responseTracks = parsePpcShortAnswerDocument(source, lessonNumbers);
  const levelLessons = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.levelId, LEVEL_ID));

  const plans: Array<{
    lesson: (typeof LESSONS)[number];
    existing: (typeof levelLessons)[number];
    quizTrack: (typeof quizTracks)[number];
    responseTrack: (typeof responseTracks)[number];
    notesContent: string | null;
  }> = [];
  for (const lesson of LESSONS) {
    const quizTrack = quizTracks.find((track) => track.trackNumber === lesson.lessonNumber);
    const responseTrack = responseTracks.find(
      (track) => track.trackNumber === lesson.lessonNumber,
    );
    const existing = levelLessons.find((row) => row.lessonNumber === lesson.lessonNumber);
    if (!quizTrack) throw new Error(`Missing MCQ track ${lesson.lessonNumber} in source document.`);
    if (!responseTrack?.responsePromptHtml) {
      throw new Error(`Missing SAQ track ${lesson.lessonNumber} in source document.`);
    }
    if (!existing) throw new Error(`Lesson L${LEVEL_ID}.${lesson.lessonNumber} not found.`);

    const existingQuestions = await db
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.lessonId, existing.id));
    const [{ value: attemptCount }] = await db
      .select({ value: count() })
      .from(schema.quizAttempts)
      .where(eq(schema.quizAttempts.lessonId, existing.id));
    const [{ value: submissionCount }] = await db
      .select({ value: count() })
      .from(schema.writtenSubmissions)
      .where(eq(schema.writtenSubmissions.lessonId, existing.id));

    const replaceNotes =
      !existing.notesContent?.trim() || existing.notesContent.startsWith(SEED_NOTES_PREFIX);
    const notesContent = replaceNotes ? HOLDING_NOTES : existing.notesContent;
    const readiness = getLessonPublishReadiness({
      title: lesson.title,
      audioUrl: lesson.audioUrl,
      notesContent,
      responsePrompt: responseTrack.responsePromptHtml,
      responseMarkingGuide: responseTrack.responseMarkingGuideHtml,
      questions: quizTrack.questions.map((question) => ({
        questionType: "multiple_choice",
        questionText: question.questionText,
        options: question.options,
        correctAnswer: question.correctAnswer,
      })),
    });
    const blockingRequirement = readiness.requirements.find((requirement) => !requirement.met);

    console.log(`\nLesson L${LEVEL_ID}.${lesson.lessonNumber} (id ${existing.id})`);
    console.log(`  title:        "${existing.title}" -> "${lesson.title}"`);
    console.log(`  status:       ${existing.status} -> ${publish ? "published" : existing.status}`);
    console.log(`  audio:        ${existing.audioUrl ?? "(none)"} -> ${lesson.audioUrl}`);
    console.log(
      `  notes:        ${replaceNotes ? `seed filler -> ${HOLDING_NOTES}` : "present (unchanged)"}`,
    );
    console.log(`  response:     ${existing.responsePrompt ? "present" : "missing"} -> replaced`);
    console.log(`  MCQs:         ${existingQuestions.length} -> ${quizTrack.questions.length}`);
    console.log(`  quiz attempts already recorded:       ${attemptCount}`);
    console.log(`  written submissions already recorded: ${submissionCount}`);
    console.log(
      `  ready to publish: ${readiness.isReady ? "yes" : `no (${blockingRequirement?.detail ?? blockingRequirement?.label})`}`,
    );
    for (const question of quizTrack.questions) {
      console.log(`  ${question.sortOrder}. ${question.questionText}`);
      console.log(`     answer: ${question.correctAnswer}`);
    }
    console.log(`  written response prompt:\n${responseTrack.responsePromptHtml}`);

    if (publish && !readiness.isReady) {
      throw new Error(`L${LEVEL_ID}.${lesson.lessonNumber} is not ready to publish.`);
    }
    plans.push({ lesson, existing, quizTrack, responseTrack, notesContent });
  }

  // Cohort schedule: the same positions and release times the cohort seed would give.
  let schedule: {
    cohortId: number;
    rows: Array<{
      lessonId: number;
      dayNumber: number;
      weekNumber: number;
      curriculumLevel: number;
      curriculumOrder: number;
      isRequired: boolean;
      liveSessionNumber: number | null;
      releaseAt: Date;
    }>;
  } | null = null;
  if (scheduleSlug) {
    const [cohort] = await db
      .select()
      .from(schema.sogpCohorts)
      .where(eq(schema.sogpCohorts.slug, scheduleSlug));
    if (!cohort) throw new Error(`Cohort "${scheduleSlug}" not found.`);
    const dates = buildSogpTrackReleaseDates(resolveFirstReleaseAt(cohort.startsAt));
    const selection = buildFirstCohortTrackSelection().filter(
      (item) => item.curriculumLevel === SOGP_LEVEL,
    );
    const rows = selection.map((item) => {
      const plan = plans.find(
        (candidate) =>
          item.levelId === LEVEL_ID && candidate.lesson.lessonNumber === item.lessonNumber,
      );
      if (!plan) throw new Error(`No lesson for SOGP order ${item.curriculumOrder}.`);
      return {
        lessonId: plan.existing.id,
        dayNumber: item.dayNumber,
        weekNumber: item.weekNumber,
        curriculumLevel: item.curriculumLevel,
        curriculumOrder: item.curriculumOrder,
        isRequired: item.isRequired,
        liveSessionNumber: item.liveSessionNumber,
        releaseAt: dates[item.curriculumOrder - 1]!,
      };
    });
    const clashes = await db
      .select()
      .from(schema.sogpCohortTracks)
      .where(
        and(
          eq(schema.sogpCohortTracks.cohortId, cohort.id),
          inArray(
            schema.sogpCohortTracks.curriculumOrder,
            rows.map((row) => row.curriculumOrder),
          ),
        ),
      );
    if (clashes.length) {
      throw new Error(`${cohort.title} already has rows at SOGP order ${clashes.map((row) => row.curriculumOrder).join(", ")}.`);
    }
    if (!publish && plans.some((plan) => plan.existing.status !== "published")) {
      throw new Error("Scheduling needs published lessons; add --publish.");
    }
    console.log(`\nSchedule for ${cohort.title} (id ${cohort.id}):`);
    for (const row of rows) {
      const plan = plans.find((candidate) => candidate.existing.id === row.lessonId)!;
      console.log(
        `  order ${row.curriculumOrder} | week ${row.weekNumber} day ${row.dayNumber} | releases ${row.releaseAt.toISOString()} | ${plan.lesson.title}`,
      );
    }
    schedule = { cohortId: cohort.id, rows };
  }

  if (!apply) {
    console.log("\n[dry run] no changes written; re-run with --apply.");
    return;
  }

  await transactionDb.transaction(async (tx) => {
    for (const { lesson, existing, quizTrack, responseTrack, notesContent } of plans) {
      await tx
        .update(schema.lessons)
        .set({
          title: lesson.title,
          audioUrl: lesson.audioUrl,
          audioUploadKey: null,
          audioFileName: null,
          audioFileSize: null,
          audioUploadedAt: null,
          notesContent,
          responsePrompt: responseTrack.responsePromptHtml,
          responseMarkingGuide: responseTrack.responseMarkingGuideHtml,
          ...(publish ? { status: "published" as const } : {}),
          updatedAt: new Date(),
        })
        .where(eq(schema.lessons.id, existing.id));

      await tx
        .delete(schema.quizQuestions)
        .where(eq(schema.quizQuestions.lessonId, existing.id));

      await tx.insert(schema.quizQuestions).values(
        quizTrack.questions.map((question) => ({
          lessonId: existing.id,
          questionType: "multiple_choice" as const,
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          sortOrder: question.sortOrder,
        })),
      );
    }

    if (schedule) {
      await tx.insert(schema.sogpCohortTracks).values(
        schedule.rows.map((row) => ({ cohortId: schedule.cohortId, ...row })),
      );
    }
  });

  console.log(
    `\nUpdated ${plans.length} lessons${publish ? ", published them" : ""}${schedule ? ` and scheduled ${schedule.rows.length} for ${scheduleSlug}` : ""}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
