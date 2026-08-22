import { describe, expect, test } from "vitest";

import { assertCanAccessQaThread } from "./qa-access";

const studentSession = {
  user: {
    id: "student-1",
    name: "Student One",
    email: "student@example.com",
    role: "student" as const,
  },
};

const otherStudentSession = {
  user: {
    id: "student-2",
    name: "Student Two",
    email: "student2@example.com",
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

describe("qa thread access", () => {
  test("allows a student to access their own thread", () => {
    expect(() =>
      assertCanAccessQaThread(studentSession, { id: 1, userId: "student-1" }),
    ).not.toThrow();
  });

  test("rejects a student trying to access another student's thread", () => {
    expect(() =>
      assertCanAccessQaThread(otherStudentSession, { id: 1, userId: "student-1" }),
    ).toThrow("Forbidden: students can only access their own Q&A threads");
  });

  test("allows staff to access any student thread", () => {
    expect(() =>
      assertCanAccessQaThread(instructorSession, { id: 1, userId: "student-1" }),
    ).not.toThrow();
    expect(() =>
      assertCanAccessQaThread(adminSession, { id: 1, userId: "student-1" }),
    ).not.toThrow();
  });
});
