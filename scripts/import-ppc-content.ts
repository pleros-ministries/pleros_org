import { readFileSync } from "node:fs";

import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

import {
  getPpcImportReadiness,
  parsePpcMcqDocument,
  parsePpcShortAnswerDocument,
  parsePpcTranscriptNotes,
  type ParsedPpcTrackResponse,
  type ParsedPpcTrackNotes,
  type ParsedPpcTrackQuiz,
} from "@/lib/ppc-content-import";
import { extractTeachingLessonNumber } from "@/lib/ppc-teaching-sync";

config({ path: ".env" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED });

type TargetScope = {
  levelId: number;
  questionDocPath: string;
  notesDocPath: string;
  trackNumbers: number[];
  readinessTrackNumbers: number[];
  releaseTrackNumbers: number[];
  audioManifestPath: string;
};

const TARGETS: TargetScope[] = [
  {
    levelId: 1,
    questionDocPath: "tmp/ppc-l1-questions.txt",
    notesDocPath: "tmp/ppc-l1-notes.txt",
    trackNumbers: [1, 2, 3, 4, 5],
    readinessTrackNumbers: [1, 2, 3, 4, 5],
    releaseTrackNumbers: [1, 2, 3, 4, 5],
    audioManifestPath: "docs/level-1-ppc-teachings.json",
  },
  {
    levelId: 2,
    questionDocPath: "tmp/ppc-l2-questions.txt",
    notesDocPath: "tmp/ppc-l2-notes.txt",
    trackNumbers: [1, 2],
    readinessTrackNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    releaseTrackNumbers: [1, 2],
    audioManifestPath: "docs/level-2-ppc-teachings.json",
  },
];

function readText(path: string) {
  return readFileSync(path, "utf8");
}

function pickTracks<T extends { trackNumber: number }>(tracks: T[], trackNumbers: number[]) {
  const selected = trackNumbers.map((trackNumber) => {
    const track = tracks.find((entry) => entry.trackNumber === trackNumber);
    if (!track) {
      throw new Error(`Missing track ${trackNumber} in source document.`);
    }
    return track;
  });

  return new Map(selected.map((track) => [track.trackNumber, track]));
}

function readAudioTrackNumbers(manifestPath: string) {
  const manifest = JSON.parse(readText(manifestPath)) as Array<{ name: string }>;

  return manifest.map((entry) => {
    const trackNumber = extractTeachingLessonNumber(entry.name);
    if (!trackNumber) {
      throw new Error(`Could not extract track number from ${entry.name}.`);
    }
    return trackNumber;
  });
}

function parseTracksSafely<T extends { trackNumber: number }>(
  parseTrack: (trackNumber: number) => T[],
  trackNumbers: number[],
) {
  return trackNumbers.flatMap((trackNumber) => {
    try {
      return parseTrack(trackNumber);
    } catch {
      return [];
    }
  });
}

function getImportReadinessReport(scope: TargetScope) {
  const questionText = readText(scope.questionDocPath);
  const notesText = readText(scope.notesDocPath);
  const quizTracks = parseTracksSafely(
    (trackNumber) => parsePpcMcqDocument(questionText, [trackNumber]),
    scope.readinessTrackNumbers,
  );
  const responseTracks = parseTracksSafely(
    (trackNumber) => parsePpcShortAnswerDocument(questionText, [trackNumber]),
    scope.readinessTrackNumbers,
  );
  const noteTracks = parseTracksSafely(
    (trackNumber) => parsePpcTranscriptNotes(notesText, [trackNumber]),
    scope.readinessTrackNumbers,
  );

  return getPpcImportReadiness({
    trackNumbers: scope.readinessTrackNumbers,
    releaseTrackNumbers: scope.releaseTrackNumbers,
    audioTrackNumbers: readAudioTrackNumbers(scope.audioManifestPath),
    quizTracks,
    responseTracks,
    noteTracks,
  });
}

async function importLevel(scope: TargetScope) {
  const quizTracks = pickTracks<ParsedPpcTrackQuiz>(
    parsePpcMcqDocument(readText(scope.questionDocPath), scope.trackNumbers),
    scope.trackNumbers,
  );
  const noteTracks = pickTracks<ParsedPpcTrackNotes>(
    parsePpcTranscriptNotes(readText(scope.notesDocPath), scope.trackNumbers),
    scope.trackNumbers,
  );
  const responseTracks = pickTracks<ParsedPpcTrackResponse>(
    parsePpcShortAnswerDocument(readText(scope.questionDocPath), scope.trackNumbers),
    scope.trackNumbers,
  );

  const client = await pool.connect();
  let transactionStarted = false;

  try {
    const lessonResult = await client.query<{
      id: number;
      lesson_number: number;
      title: string;
    }>(
      `
        select id, lesson_number, title
        from lessons
        where level_id = $1
          and lesson_number = any($2::int[])
        order by lesson_number
      `,
      [scope.levelId, scope.trackNumbers],
    );

    if (lessonResult.rows.length !== scope.trackNumbers.length) {
      throw new Error(
        `Expected ${scope.trackNumbers.length} lessons for level ${scope.levelId}, found ${lessonResult.rows.length}.`,
      );
    }

    const lessonIds = lessonResult.rows.map((lesson) => lesson.id);

    const existingQuestionResult = await client.query<{
      lesson_id: number;
      question_type: string;
      count: string;
    }>(
      `
        select lesson_id, question_type, count(*)::text as count
        from quiz_questions
        where lesson_id = any($1::int[])
        group by lesson_id, question_type
      `,
      [lessonIds],
    );

    const hasUnexpectedQuestionShape = existingQuestionResult.rows.some(
      (row) => row.question_type !== "multiple_choice",
    );

    if (hasUnexpectedQuestionShape) {
      throw new Error(
        `Level ${scope.levelId} contains non-MCQ quiz questions in the import target range. Refusing to overwrite.`,
      );
    }

    await client.query("begin");
    transactionStarted = true;

    await client.query("delete from quiz_questions where lesson_id = any($1::int[])", [
      lessonIds,
    ]);

    const importedLessons: Array<{
      lessonId: number;
      lessonNumber: number;
      title: string;
      questionCount: number;
    }> = [];

    for (const lesson of lessonResult.rows) {
      const quizTrack = quizTracks.get(lesson.lesson_number);
      const noteTrack = noteTracks.get(lesson.lesson_number);
      const responseTrack = responseTracks.get(lesson.lesson_number);

      if (!quizTrack || !noteTrack || !responseTrack) {
        throw new Error(
          `Missing import payload for level ${scope.levelId} lesson ${lesson.lesson_number}.`,
        );
      }

      await client.query(
        `
          update lessons
          set notes_content = $2,
              response_prompt = $3,
              response_marking_guide = $4,
              updated_at = now()
          where id = $1
        `,
        [
          lesson.id,
          noteTrack.notesHtml,
          responseTrack.responsePromptHtml,
          responseTrack.responseMarkingGuideHtml,
        ],
      );

      for (const question of quizTrack.questions) {
        await client.query(
          `
            insert into quiz_questions (
              lesson_id,
              question_type,
              question_text,
              options,
              correct_answer,
              sort_order
            )
            values ($1, 'multiple_choice', $2, $3::jsonb, $4, $5)
          `,
          [
            lesson.id,
            question.questionText,
            JSON.stringify(question.options),
            question.correctAnswer,
            question.sortOrder,
          ],
        );
      }

      importedLessons.push({
        lessonId: lesson.id,
        lessonNumber: lesson.lesson_number,
        title: lesson.title,
        questionCount: quizTrack.questions.length,
      });
    }

    await client.query("commit");
    transactionStarted = false;

    return importedLessons;
  } catch (error) {
    if (transactionStarted) {
      await client.query("rollback");
    }
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  const summary = [];

  for (const scope of TARGETS) {
    const importedLessons = await importLevel(scope);
    summary.push({
      levelId: scope.levelId,
      lessonCount: importedLessons.length,
      lessons: importedLessons,
      readiness: getImportReadinessReport(scope),
    });
  }

  console.log(JSON.stringify({ imported: summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
