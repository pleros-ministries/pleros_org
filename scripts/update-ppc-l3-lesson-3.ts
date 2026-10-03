import { readFileSync } from "node:fs";
import { count, eq } from "drizzle-orm";

// Dynamic imports: tsx loads the static form as ESM and can't see the db module's named export.
// Dry run by default. `--apply` syncs the content; `--apply --publish` also releases the lesson.
const apply = process.argv.includes("--apply");
const publish = process.argv.includes("--publish");

const LEVEL_ID = 3;
const LESSON_NUMBER = 3;
const TITLE = "The Walk of Faith";
const AUDIO_URL =
  "https://res.cloudinary.com/v6emrxzj/video/upload/v1791009822/8._The_Walk_of_Faith_-_5_Mar_2026.mp3";
const SOURCE_DOC_PATH = "tmp/ppc-l3-lesson3-questions.txt";
// The seeded filler notes are not real teaching content; swap them for the L3.1 holding line.
const SEED_NOTES_PREFIX = "## Teaching Notes\n\nThis lesson covers foundational principles";
const HOLDING_NOTES = "<p>Transcripts would be uploaded soon.</p>";

async function main() {
  const { db } = await import("../lib/db");
  const { transactionDb } = await import("../lib/db/transaction");
  const schema = await import("../lib/db/schema");
  const { parsePpcMcqDocument, parsePpcShortAnswerDocument } = await import(
    "../lib/ppc-content-import"
  );
  const { getLessonPublishReadiness } = await import("../lib/ppc-content-cms");

  const source = readFileSync(SOURCE_DOC_PATH, "utf8");
  const [quizTrack] = parsePpcMcqDocument(source, [LESSON_NUMBER]);
  const [responseTrack] = parsePpcShortAnswerDocument(source, [LESSON_NUMBER]);

  if (!quizTrack) throw new Error(`Missing MCQ track ${LESSON_NUMBER} in source document.`);
  if (!responseTrack) {
    throw new Error(`Missing SAQ track ${LESSON_NUMBER} in source document.`);
  }

  const target = await db
    .select()
    .from(schema.lessons)
    .where(eq(schema.lessons.levelId, LEVEL_ID));
  const existing = target.find((row) => row.lessonNumber === LESSON_NUMBER);
  if (!existing) {
    throw new Error(`Lesson L${LEVEL_ID}.${LESSON_NUMBER} not found.`);
  }

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
    title: TITLE,
    audioUrl: AUDIO_URL,
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

  console.log(`Lesson L${LEVEL_ID}.${LESSON_NUMBER} (id ${existing.id})`);
  console.log(`  title:        "${existing.title}" -> "${TITLE}"`);
  console.log(`  status:       ${existing.status} -> ${publish ? "published" : existing.status}`);
  console.log(`  audio:        ${existing.audioUrl ?? "(none)"} -> ${AUDIO_URL}`);
  console.log(
    `  notes:        ${replaceNotes ? `seed filler -> ${HOLDING_NOTES}` : "present (unchanged)"}`,
  );
  console.log(
    `  response:     ${existing.responsePrompt ? "present" : "missing"} -> ${responseTrack.responsePromptHtml ? "replaced" : "cleared"}`,
  );
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

  if (publish && !readiness.isReady) {
    throw new Error("Lesson is not ready to publish.");
  }

  if (!apply) {
    console.log("[dry run] no changes written; re-run with --apply.");
    return;
  }

  await transactionDb.transaction(async (tx) => {
    await tx
      .update(schema.lessons)
      .set({
        title: TITLE,
        audioUrl: AUDIO_URL,
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
  });

  console.log(
    `Updated L${LEVEL_ID}.${LESSON_NUMBER} -> "${TITLE}" with ${quizTrack.questions.length} MCQs${publish ? " and published it" : ""}.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
