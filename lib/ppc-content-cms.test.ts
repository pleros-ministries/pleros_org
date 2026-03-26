import { describe, expect, test } from "vitest";

import {
  getLevelDeletionState,
  hasLevelDraftChanges,
  getLessonDeletionState,
  getLessonPublishReadiness,
  getLessonAudioCleanupKey,
  getLessonAudioDraftSummary,
  getLessonAudioAssetLabel,
  getNextLevelSortOrder,
  getNextLessonNumber,
  hasLessonDraftChanges,
  moveQuestionInOrder,
  parseQuestionOptions,
  removeLevelFromOrder,
  renumberLessonsForTarget,
  renumberLevelsForTarget,
  resolveLessonAudioUrl,
  resolveManagedLessonAudioDraft,
  validateQuizQuestionDraft,
} from "./ppc-content-cms";

describe("ppc content cms helpers", () => {
  test("derives the next lesson number from existing lessons", () => {
    expect(
      getNextLessonNumber([
        { lessonNumber: 1 },
        { lessonNumber: 2 },
        { lessonNumber: 4 },
      ]),
    ).toBe(5);

    expect(getNextLessonNumber([])).toBe(1);
  });

  test("normalizes question options from mixed separators", () => {
    expect(
      parseQuestionOptions(" Grace, Faith\nHope ,,  Charity "),
    ).toEqual(["Grace", "Faith", "Hope", "Charity"]);
  });

  test("accepts a valid multiple choice draft", () => {
    expect(
      validateQuizQuestionDraft({
        questionType: "multiple_choice",
        questionText: "What is the theme?",
        optionsText: "Grace, Faith, Hope",
        correctAnswer: "Faith",
      }),
    ).toEqual({
      options: ["Grace", "Faith", "Hope"],
    });
  });

  test("rejects invalid multiple choice drafts", () => {
    expect(
      validateQuizQuestionDraft({
        questionType: "multiple_choice",
        questionText: "Pick one",
        optionsText: "Grace",
        correctAnswer: "Grace",
      }),
    ).toEqual({
      error: "Multiple choice questions need at least two options.",
    });

    expect(
      validateQuizQuestionDraft({
        questionType: "multiple_choice",
        questionText: "Pick one",
        optionsText: "Grace, Faith",
        correctAnswer: "Hope",
      }),
    ).toEqual({
      error: "Correct answer must match one of the listed options.",
    });
  });

  test("rejects short text drafts without an answer", () => {
    expect(
      validateQuizQuestionDraft({
        questionType: "short_text",
        questionText: "Explain the doctrine",
        optionsText: "",
        correctAnswer: "   ",
      }),
    ).toEqual({
      error: "Short text questions need an expected answer.",
    });
  });

  test("detects lesson draft changes", () => {
    expect(
      hasLessonDraftChanges(
        {
          title: "Lesson title",
          audioUrl: "https://audio.test/file.mp3",
          notesContent: "Original notes",
        },
        {
          title: "Lesson title",
          audioUrl: "https://audio.test/file.mp3",
          notesContent: "Original notes",
        },
      ),
    ).toBe(false);

    expect(
      hasLessonDraftChanges(
        {
          title: "Lesson title",
          audioUrl: null,
          notesContent: null,
        },
        {
          title: "Updated title",
          audioUrl: "",
          notesContent: "",
        },
      ),
    ).toBe(true);
  });

  test("detects lesson audio management changes even when the url stays the same", () => {
    expect(
      hasLessonDraftChanges(
        {
          title: "Lesson title",
          audioUrl: "https://cdn.example.com/lesson.mp3",
          audioUploadKey: "managed_key",
          notesContent: "Original notes",
        },
        {
          title: "Lesson title",
          audioUrl: "https://cdn.example.com/lesson.mp3",
          audioUploadKey: null,
          notesContent: "Original notes",
        },
      ),
    ).toBe(true);
  });

  test("detects lesson number changes", () => {
    expect(
      hasLessonDraftChanges(
        {
          lessonNumber: 2,
          title: "Lesson title",
          audioUrl: null,
          notesContent: "Original notes",
        },
        {
          lessonNumber: 3,
          title: "Lesson title",
          audioUrl: "",
          notesContent: "Original notes",
        },
      ),
    ).toBe(true);
  });

  test("prefers an uploaded audio url over a manual draft url", () => {
    expect(
      resolveLessonAudioUrl({
        manualUrl: "https://example.com/manual.mp3",
        uploadedUrl: " https://cdn.example.com/uploaded.mp3 ",
      }),
    ).toBe("https://cdn.example.com/uploaded.mp3");
  });

  test("falls back to the manual audio url when no upload exists", () => {
    expect(
      resolveLessonAudioUrl({
        manualUrl: " https://example.com/manual.mp3 ",
        uploadedUrl: null,
      }),
    ).toBe("https://example.com/manual.mp3");

    expect(
      resolveLessonAudioUrl({
        manualUrl: "   ",
        uploadedUrl: null,
      }),
    ).toBeNull();
  });

  test("derives a readable label for the current audio asset", () => {
    expect(
      getLessonAudioAssetLabel(
        "https://utfs.io/f/some-key/My%20lesson%20audio%20v1.mp3?download=1",
      ),
    ).toBe("My lesson audio v1.mp3");

    expect(getLessonAudioAssetLabel(null)).toBeNull();
  });

  test("builds a managed lesson audio draft from an uploaded asset", () => {
    expect(
      resolveManagedLessonAudioDraft({
        manualUrl: "https://example.com/manual.mp3",
        uploadedAsset: {
          url: "https://cdn.example.com/uploads/lesson-1.mp3",
          uploadKey: "ut_123",
          fileName: "lesson-1.mp3",
          fileSize: 2048,
          uploadedAt: "2026-03-26T03:00:00.000Z",
        },
      }),
    ).toEqual({
      audioUrl: "https://cdn.example.com/uploads/lesson-1.mp3",
      audioUploadKey: "ut_123",
      audioFileName: "lesson-1.mp3",
      audioFileSize: 2048,
      audioUploadedAt: "2026-03-26T03:00:00.000Z",
    });
  });

  test("falls back to a manual lesson audio draft when no upload asset exists", () => {
    expect(
      resolveManagedLessonAudioDraft({
        manualUrl: " https://example.com/manual.mp3 ",
        uploadedAsset: null,
      }),
    ).toEqual({
      audioUrl: "https://example.com/manual.mp3",
      audioUploadKey: null,
      audioFileName: null,
      audioFileSize: null,
      audioUploadedAt: null,
    });
  });

  test("chooses the previous upload key for cleanup when replacing a managed file", () => {
    expect(
      getLessonAudioCleanupKey({
        previousUploadKey: "old_key",
        nextUploadKey: "new_key",
      }),
    ).toBe("old_key");

    expect(
      getLessonAudioCleanupKey({
        previousUploadKey: "same_key",
        nextUploadKey: "same_key",
      }),
    ).toBeNull();

    expect(
      getLessonAudioCleanupKey({
        previousUploadKey: "old_key",
        nextUploadKey: null,
      }),
    ).toBe("old_key");
  });

  test("formats lesson audio metadata for the cms summary", () => {
    expect(
      getLessonAudioDraftSummary({
        audioUrl: "https://cdn.example.com/uploads/lesson-1.mp3",
        audioUploadKey: "ut_123",
        audioFileName: "lesson-1.mp3",
        audioFileSize: 2_150_000,
        audioUploadedAt: "2026-03-26T03:00:00.000Z",
      }),
    ).toEqual({
      label: "lesson-1.mp3",
      source: "Uploaded file",
      meta: "2.1 MB uploaded Mar 26, 2026",
    });
  });

  test("marks a lesson as publish-ready when core content is complete", () => {
    const readiness = getLessonPublishReadiness({
      title: "Lesson 1",
      audioUrl: "https://cdn.example.com/lesson-1.mp3",
      notesContent: "Lesson notes",
      questions: [
        {
          questionType: "multiple_choice",
          questionText: "What is grace?",
          options: ["Gift", "Work"],
          correctAnswer: "Gift",
        },
      ],
    });

    expect(readiness.isReady).toBe(true);
    expect(readiness.requirements.every((requirement) => requirement.met)).toBe(
      true,
    );
  });

  test("blocks publishing when lesson content is incomplete", () => {
    const readiness = getLessonPublishReadiness({
      title: "   ",
      audioUrl: "",
      notesContent: "",
      questions: [],
    });

    expect(readiness.isReady).toBe(false);
    expect(readiness.requirements.map((requirement) => requirement.met)).toEqual([
      false,
      false,
      false,
      false,
    ]);
  });

  test("flags invalid quiz configuration before publish", () => {
    const readiness = getLessonPublishReadiness({
      title: "Lesson 2",
      audioUrl: "https://cdn.example.com/lesson-2.mp3",
      notesContent: "Lesson notes",
      questions: [
        {
          questionType: "multiple_choice",
          questionText: "Pick one",
          options: ["Faith"],
          correctAnswer: "Faith",
        },
      ],
    });

    expect(readiness.isReady).toBe(false);
    expect(readiness.requirements.at(-1)).toEqual({
      id: "questions_valid",
      label: "Quiz answers match the configured options.",
      met: false,
      detail: "Question 1 needs at least two multiple choice options.",
    });
  });

  test("allows deleting draft lessons", () => {
    expect(getLessonDeletionState("draft")).toEqual({
      canDelete: true,
      detail: "Delete this lesson and its quiz, progress, submissions, and Q&A records.",
    });
  });

  test("blocks deleting published lessons until they are unpublished", () => {
    expect(getLessonDeletionState("published")).toEqual({
      canDelete: false,
      detail: "Unpublish this lesson before deleting it.",
    });
  });

  test("moves a quiz question up and reassigns sort order", () => {
    expect(
      moveQuestionInOrder(
        [
          { id: 1, sortOrder: 1 },
          { id: 2, sortOrder: 2 },
          { id: 3, sortOrder: 3 },
        ],
        2,
        "up",
      ),
    ).toEqual([
      { id: 2, sortOrder: 1 },
      { id: 1, sortOrder: 2 },
      { id: 3, sortOrder: 3 },
    ]);
  });

  test("keeps quiz order unchanged when moving past a boundary", () => {
    expect(
      moveQuestionInOrder(
        [
          { id: 1, sortOrder: 1 },
          { id: 2, sortOrder: 2 },
        ],
        1,
        "up",
      ),
    ).toEqual([
      { id: 1, sortOrder: 1 },
      { id: 2, sortOrder: 2 },
    ]);
  });

  test("renumbers sibling lessons when moving a lesson earlier", () => {
    expect(
      renumberLessonsForTarget(
        [
          { id: 11, lessonNumber: 1 },
          { id: 12, lessonNumber: 2 },
          { id: 13, lessonNumber: 3 },
        ],
        13,
        1,
      ),
    ).toEqual([
      { id: 13, lessonNumber: 1 },
      { id: 11, lessonNumber: 2 },
      { id: 12, lessonNumber: 3 },
    ]);
  });

  test("clamps lesson renumbering to the end of the level", () => {
    expect(
      renumberLessonsForTarget(
        [
          { id: 11, lessonNumber: 1 },
          { id: 12, lessonNumber: 2 },
          { id: 13, lessonNumber: 3 },
        ],
        11,
        99,
      ),
    ).toEqual([
      { id: 12, lessonNumber: 1 },
      { id: 13, lessonNumber: 2 },
      { id: 11, lessonNumber: 3 },
    ]);
  });

  test("detects level draft changes", () => {
    expect(
      hasLevelDraftChanges(
        {
          sortOrder: 2,
          title: "Level 2",
          description: "Original description",
        },
        {
          sortOrder: 3,
          title: "Level 2 revised",
          description: "Original description",
        },
      ),
    ).toBe(true);
  });

  test("renumbers sibling levels when moving a level earlier", () => {
    expect(
      renumberLevelsForTarget(
        [
          { id: 1, sortOrder: 1 },
          { id: 2, sortOrder: 2 },
          { id: 3, sortOrder: 3 },
        ],
        3,
        1,
      ),
    ).toEqual([
      { id: 3, sortOrder: 1 },
      { id: 1, sortOrder: 2 },
      { id: 2, sortOrder: 3 },
    ]);
  });

  test("derives the next level sort order from existing levels", () => {
    expect(
      getNextLevelSortOrder([
        { sortOrder: 1 },
        { sortOrder: 2 },
        { sortOrder: 4 },
      ]),
    ).toBe(5);

    expect(getNextLevelSortOrder([])).toBe(1);
  });

  test("allows deleting empty levels", () => {
    expect(getLevelDeletionState(0)).toEqual({
      canDelete: true,
      detail: "Delete this empty level from the pathway.",
    });
  });

  test("blocks deleting levels that still have lessons", () => {
    expect(getLevelDeletionState(3)).toEqual({
      canDelete: false,
      detail: "Move or delete this level's lessons before deleting the level.",
    });
  });

  test("removes a level and closes sort-order gaps", () => {
    expect(
      removeLevelFromOrder(
        [
          { id: 1, sortOrder: 1 },
          { id: 2, sortOrder: 2 },
          { id: 3, sortOrder: 3 },
        ],
        2,
      ),
    ).toEqual([
      { id: 1, sortOrder: 1 },
      { id: 3, sortOrder: 2 },
    ]);
  });
});
