import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import { transactionDb } from "../lib/db/transaction";
import * as schema from "../lib/db/schema";
import {
  parsePpcMcqDocument,
  parsePpcShortAnswerDocument,
} from "../lib/ppc-content-import";

const LEVEL_ID = 3;
const LESSON_NUMBER = 2;
const TITLE = "Discipline – The Drive of the Spirit";
const AUDIO_URL =
  "https://res.cloudinary.com/dxajhzf4d/video/upload/samples/Music/25._Discipline_-_The_Drive_of_the_Sprit_-_31_May_2026_qkjujs.mp3";
const SOURCE_DOC_PATH = "tmp/ppc-l3-lesson2-questions.txt";

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
      responsePrompt: responseTrack.responsePromptHtml,
      responseMarkingGuide: responseTrack.responseMarkingGuideHtml,
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
  `Updated L${LEVEL_ID}.${LESSON_NUMBER} -> "${TITLE}" with ${quizTrack.questions.length} MCQs.`,
);
