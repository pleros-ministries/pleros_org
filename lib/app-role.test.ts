import { describe, expect, test } from "vitest";

import {
  normalizeEmailList,
  resolveRoleFromEmail,
  type AppRole,
} from "./app-role";

describe("app role resolution", () => {
  test("normalizeEmailList handles empty and trims/lowercases", () => {
    expect(normalizeEmailList(undefined)).toEqual([]);
    expect(normalizeEmailList(" admin@x.com, INSTR@x.com ")).toEqual([
      "admin@x.com",
      "instr@x.com",
    ]);
  });

  test("resolveRoleFromEmail prioritizes admin over instructor", () => {
    const adminEmails = ["person@example.com"];
    const instructorEmails = ["person@example.com", "inst@example.com"];

    expect(resolveRoleFromEmail("person@example.com", adminEmails, instructorEmails)).toBe(
      "admin",
    );
    expect(resolveRoleFromEmail("inst@example.com", adminEmails, instructorEmails)).toBe(
      "instructor",
    );
  });

  test("resolveRoleFromEmail defaults to student", () => {
    expect(resolveRoleFromEmail("student@example.com", [], [])).toBe("student");
  });

  test("role union stays stable", () => {
    const roles: AppRole[] = ["admin", "instructor", "student"];
    expect(roles).toHaveLength(3);
  });
});
