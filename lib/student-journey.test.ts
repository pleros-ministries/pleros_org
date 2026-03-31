import { describe, expect, test } from "vitest";

import {
  getCurrentLevelId,
  getDashboardFocus,
  getLevelJourneyRows,
  getLessonCompletionState,
} from "./student-journey";

describe("student journey helpers", () => {
  test("derives the current level from graduated levels", () => {
    expect(getCurrentLevelId([], 5)).toBe(1);
    expect(getCurrentLevelId([1, 2], 5)).toBe(3);
    expect(getCurrentLevelId([1, 2, 3, 4, 5], 5)).toBe(5);
  });

  test("builds pathway rows with graduated, current, and locked states", () => {
    expect(
      getLevelJourneyRows(
        [
          { id: 1, title: "Foundations" },
          { id: 2, title: "Practice" },
          { id: 3, title: "Mission" },
        ],
        new Set([1]),
        2,
      ),
    ).toEqual([
      {
        id: 1,
        title: "Foundations",
        state: "graduated",
        href: "/ppc/student/level/1",
        statusLabel: "Graduated",
      },
      {
        id: 2,
        title: "Practice",
        state: "current",
        href: "/ppc/student/level/2",
        statusLabel: "Current level",
      },
      {
        id: 3,
        title: "Mission",
        state: "locked",
        href: null,
        statusLabel: "Locked",
      },
    ]);
  });

  test("summarizes the current dashboard focus when there is a next lesson", () => {
    expect(
      getDashboardFocus({
        currentLevelId: 2,
        completedLessons: 1,
        totalLessons: 4,
        nextLesson: {
          id: 42,
          lessonNumber: 2,
          title: "Grace in practice",
        },
      }),
    ).toEqual({
      eyebrow: "Current focus",
      title: "Continue lesson 2",
      description: "Grace in practice",
      ctaLabel: "Continue learning",
      ctaHref: "/ppc/student/level/2/lesson/42",
    });
  });

  test("summarizes the dashboard focus when all lessons are complete", () => {
    expect(
      getDashboardFocus({
        currentLevelId: 3,
        completedLessons: 5,
        totalLessons: 5,
        nextLesson: null,
      }),
    ).toEqual({
      eyebrow: "Current focus",
      title: "Level 3 complete",
      description: "All lessons are finished. Staff graduation review is the next step.",
      ctaLabel: "Review this level",
      ctaHref: "/ppc/student/level/3",
    });
  });

  test("describes lesson completion states clearly", () => {
    expect(
      getLessonCompletionState({
        audioListened: false,
        notesRead: false,
        quizPassed: false,
        writtenApproved: false,
      }),
    ).toEqual({
      label: "Not started",
      variant: "default",
    });

    expect(
      getLessonCompletionState({
        audioListened: true,
        notesRead: false,
        quizPassed: false,
        writtenApproved: false,
      }),
    ).toEqual({
      label: "In progress",
      variant: "warning",
    });

    expect(
      getLessonCompletionState({
        audioListened: true,
        notesRead: true,
        quizPassed: true,
        writtenApproved: true,
      }),
    ).toEqual({
      label: "Complete",
      variant: "success",
    });
  });
});
