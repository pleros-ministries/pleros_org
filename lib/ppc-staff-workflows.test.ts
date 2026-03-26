import { describe, expect, test } from "vitest";

import {
  filterQaInbox,
  filterReviewQueue,
  getQaInboxCounts,
  getReviewQueueCounts,
  resolveNextSelectedThreadId,
} from "./ppc-staff-workflows";

const reviewSubmissions = [
  {
    id: 1,
    status: "pending_review",
    studentName: "Ada Grace",
    studentEmail: "ada@example.com",
    lessonTitle: "Faith foundations",
    lessonNumber: 1,
    levelId: 1,
    content: "Student response one",
  },
  {
    id: 2,
    status: "approved",
    studentName: "John Hope",
    studentEmail: "john@example.com",
    lessonTitle: "Grace and truth",
    lessonNumber: 2,
    levelId: 2,
    content: "Student response two",
  },
  {
    id: 3,
    status: "needs_revision",
    studentName: "Ada Grace",
    studentEmail: "ada@example.com",
    lessonTitle: "Grace and truth",
    lessonNumber: 3,
    levelId: 2,
    content: "Needs more detail",
  },
] as const;

const qaThreads = [
  {
    id: 10,
    status: "open",
    subject: "Need help with quiz",
    studentName: "Ada Grace",
    studentEmail: "ada@example.com",
    lessonTitle: "Faith foundations",
    lessonNumber: 1,
    levelId: 1,
  },
  {
    id: 11,
    status: "answered",
    subject: "Follow-up on submission",
    studentName: "John Hope",
    studentEmail: "john@example.com",
    lessonTitle: "Grace and truth",
    lessonNumber: 2,
    levelId: 2,
  },
  {
    id: 12,
    status: "closed",
    subject: "Resolved question",
    studentName: "Mary Faith",
    studentEmail: "mary@example.com",
    lessonTitle: "Purpose of study",
    lessonNumber: 1,
    levelId: 3,
  },
] as const;

describe("ppc staff workflow helpers", () => {
  test("counts review submissions by status", () => {
    expect(getReviewQueueCounts(reviewSubmissions)).toEqual({
      all: 3,
      pending_review: 1,
      approved: 1,
      needs_revision: 1,
    });
  });

  test("filters review submissions by tab, level, and search query", () => {
    expect(
      filterReviewQueue(reviewSubmissions, {
        activeTab: "needs_revision",
        levelId: "2",
        query: "ada",
      }).map((submission) => submission.id),
    ).toEqual([3]);
  });

  test("matches review queue search against lesson and content text", () => {
    expect(
      filterReviewQueue(reviewSubmissions, {
        activeTab: "all",
        levelId: "all",
        query: "detail",
      }).map((submission) => submission.id),
    ).toEqual([3]);
  });

  test("counts qa threads with a separate closed bucket", () => {
    expect(getQaInboxCounts(qaThreads)).toEqual({
      all: 3,
      open: 1,
      answered: 1,
      closed: 1,
    });
  });

  test("filters qa inbox by exact tab, level, and search query", () => {
    expect(
      filterQaInbox(qaThreads, {
        activeTab: "closed",
        levelId: "3",
        query: "mary",
      }).map((thread) => thread.id),
    ).toEqual([12]);
  });

  test("does not mix answered and closed threads when filtering", () => {
    expect(
      filterQaInbox(qaThreads, {
        activeTab: "answered",
        levelId: "all",
        query: "",
      }).map((thread) => thread.id),
    ).toEqual([11]);
  });

  test("keeps the current selection when it still exists in filtered threads", () => {
    expect(resolveNextSelectedThreadId(qaThreads, 11)).toBe(11);
  });

  test("falls back to the first filtered thread when the current selection disappears", () => {
    expect(
      resolveNextSelectedThreadId(
        filterQaInbox(qaThreads, {
          activeTab: "open",
          levelId: "all",
          query: "",
        }),
        12,
      ),
    ).toBe(10);
  });

  test("returns null when no qa threads remain after filtering", () => {
    expect(resolveNextSelectedThreadId([], 10)).toBeNull();
  });
});
