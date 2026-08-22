import { describe, expect, test } from "vitest";

import { getStaffAssignmentNotification } from "./staff-assignment-notifications";

describe("staff assignment notifications", () => {
  test("does not notify when an item is unassigned", () => {
    expect(
      getStaffAssignmentNotification({
        actorId: "admin-1",
        previousAssignedToId: "instructor-1",
        nextAssignedToId: null,
        itemType: "review_submission",
        studentName: "Ada Grace",
        lessonTitle: "Faith foundations",
        lessonNumber: 1,
        levelId: 1,
        appUrl: "https://ppc.pleros.org",
      }),
    ).toBeNull();
  });

  test("does not notify when the assignee did not change", () => {
    expect(
      getStaffAssignmentNotification({
        actorId: "admin-1",
        previousAssignedToId: "instructor-1",
        nextAssignedToId: "instructor-1",
        itemType: "qa_thread",
        studentName: "Ada Grace",
        threadSubject: "Need help with the quiz",
        lessonTitle: "Faith foundations",
        lessonNumber: 1,
        levelId: 1,
        appUrl: "https://ppc.pleros.org",
      }),
    ).toBeNull();
  });

  test("does not notify when a staff member assigns an item to themselves", () => {
    expect(
      getStaffAssignmentNotification({
        actorId: "instructor-1",
        previousAssignedToId: null,
        nextAssignedToId: "instructor-1",
        itemType: "review_submission",
        studentName: "Ada Grace",
        lessonTitle: "Faith foundations",
        lessonNumber: 1,
        levelId: 1,
        appUrl: "https://ppc.pleros.org",
      }),
    ).toBeNull();
  });

  test("builds a review assignment notification payload", () => {
    expect(
      getStaffAssignmentNotification({
        actorId: "admin-1",
        previousAssignedToId: null,
        nextAssignedToId: "instructor-1",
        itemType: "review_submission",
        studentName: "Ada Grace",
        lessonTitle: "Faith foundations",
        lessonNumber: 1,
        levelId: 1,
        appUrl: "https://ppc.pleros.org",
      }),
    ).toEqual({
      emailSubject: 'Assigned review: Ada Grace - "Faith foundations"',
      pushTitle: "New review assignment",
      pushBody: "Ada Grace · L1.1 Faith foundations",
      url: "https://ppc.pleros.org/admin/review",
    });
  });

  test("builds a q&a assignment notification payload", () => {
    expect(
      getStaffAssignmentNotification({
        actorId: "admin-1",
        previousAssignedToId: "instructor-2",
        nextAssignedToId: "instructor-1",
        itemType: "qa_thread",
        studentName: "Ada Grace",
        threadSubject: "Need help with the quiz",
        lessonTitle: "Faith foundations",
        lessonNumber: 1,
        levelId: 1,
        appUrl: "https://ppc.pleros.org",
      }),
    ).toEqual({
      emailSubject: 'Assigned Q&A thread: "Need help with the quiz"',
      pushTitle: "New Q&A assignment",
      pushBody: "Ada Grace · L1.1 Faith foundations",
      url: "https://ppc.pleros.org/admin/qa",
    });
  });
});
