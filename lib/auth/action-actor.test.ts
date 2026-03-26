import { describe, expect, test } from "vitest";

import {
  getSignedInActor,
  getStaffActor,
  getStudentSelfActor,
} from "./action-actor";

const studentSession = {
  user: {
    id: "student-1",
    name: "Student One",
    email: "student@example.com",
    role: "student" as const,
  },
};

const instructorSession = {
  user: {
    id: "instructor-1",
    name: "Instructor One",
    email: "instructor@example.com",
    role: "instructor" as const,
  },
};

const adminSession = {
  user: {
    id: "admin-1",
    name: "Admin One",
    email: "admin@example.com",
    role: "admin" as const,
  },
};

describe("action actor helpers", () => {
  test("derives the current student for self-service actions", () => {
    expect(getStudentSelfActor(studentSession)).toEqual({
      userId: "student-1",
      authorId: "student-1",
      authorRole: "student",
    });
  });

  test("rejects staff sessions for student self-service actions", () => {
    expect(() => getStudentSelfActor(instructorSession)).toThrow(
      "Forbidden: only students can perform this action",
    );
    expect(() => getStudentSelfActor(adminSession)).toThrow(
      "Forbidden: only students can perform this action",
    );
  });

  test("derives the current signed-in actor for generic authored actions", () => {
    expect(getSignedInActor(studentSession)).toEqual({
      authorId: "student-1",
      authorRole: "student",
    });
    expect(getSignedInActor(instructorSession)).toEqual({
      authorId: "instructor-1",
      authorRole: "instructor",
    });
  });

  test("derives the current staff actor for review and moderation actions", () => {
    expect(getStaffActor(instructorSession)).toEqual({
      reviewerId: "instructor-1",
      reviewerRole: "instructor",
    });
    expect(getStaffActor(adminSession)).toEqual({
      reviewerId: "admin-1",
      reviewerRole: "admin",
    });
  });

  test("rejects student sessions for staff actions", () => {
    expect(() => getStaffActor(studentSession)).toThrow(
      "Forbidden: only staff can perform this action",
    );
  });
});
