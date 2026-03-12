import { describe, expect, test } from "vitest";

import {
  buildLessonPath,
  calculateLevelProgress,
  canGraduateLevel,
  isLessonComplete,
  type LessonRequirementSignals,
} from "./student-learning";

describe("student learning flow", () => {
  test("marks a lesson incomplete when one required signal is missing", () => {
    const signals: LessonRequirementSignals = {
      audioListened: true,
      notesRead: true,
      quizPassed: true,
      writtenApproved: false,
    };

    expect(isLessonComplete(signals)).toBe(false);
  });

  test("calculates level progress by completed lessons", () => {
    const progress = calculateLevelProgress([
      {
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        writtenApproved: true,
      },
      {
        audioListened: true,
        notesRead: true,
        quizPassed: false,
        writtenApproved: false,
      },
      {
        audioListened: false,
        notesRead: false,
        quizPassed: false,
        writtenApproved: false,
      },
    ]);

    expect(progress).toBe(33);
  });

  test("blocks level graduation until every lesson is complete", () => {
    const canGraduate = canGraduateLevel([
      {
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        writtenApproved: true,
      },
      {
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        writtenApproved: false,
      },
    ]);

    expect(canGraduate).toBe(false);
  });

  test("unlocks all lessons when level policy is all_unlocked", () => {
    const lessonPath = buildLessonPath({
      lessonCount: 5,
      orderPolicy: "all_unlocked",
      completionByLesson: {
        1: {
          audioListened: true,
          notesRead: true,
          quizPassed: true,
          writtenApproved: true,
        },
      },
    });

    expect(lessonPath).toHaveLength(5);
    expect(lessonPath.every((lesson) => lesson.unlocked)).toBe(true);
  });

  test("locks later lessons after first incomplete lesson in strict policy", () => {
    const lessonPath = buildLessonPath({
      lessonCount: 5,
      orderPolicy: "strict_sequence",
      completionByLesson: {
        1: {
          audioListened: true,
          notesRead: true,
          quizPassed: true,
          writtenApproved: true,
        },
        2: {
          audioListened: true,
          notesRead: false,
          quizPassed: false,
          writtenApproved: false,
        },
      },
    });

    expect(lessonPath[0]?.unlocked).toBe(true);
    expect(lessonPath[1]?.unlocked).toBe(true);
    expect(lessonPath[2]?.unlocked).toBe(false);
    expect(lessonPath[4]?.unlocked).toBe(false);
  });
});
