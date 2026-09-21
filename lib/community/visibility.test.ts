import { describe, expect, test } from "vitest";

import { firstNameOf, toPeerMember } from "./visibility";

describe("visibility", () => {
  test("firstNameOf takes the first token", () => {
    expect(firstNameOf("Ada Grace Nwosu")).toBe("Ada");
    expect(firstNameOf("  ")).toBe("Someone");
  });

  test("toPeerMember exposes only first name, join month, stage, leader flag", () => {
    const member = toPeerMember({
      name: "Ada Grace",
      firstName: "Ada",
      joinedAt: new Date("2026-08-14T10:00:00Z"),
      role: "leader",
      cohortStatus: "preparing",
      enrollmentStatus: "enrolled",
      preparationDaysComplete: 4,
    });

    expect(member).toEqual({
      firstName: "Ada",
      joinedMonth: "Aug 2026",
      stage: "preparing",
      stageLabel: "Preparing",
      isLeader: true,
    });
    // No surname / email / phone / exact date fields.
    expect(Object.keys(member).sort()).toEqual([
      "firstName",
      "isLeader",
      "joinedMonth",
      "stage",
      "stageLabel",
    ]);
  });

  test("stage reflects progress", () => {
    expect(
      toPeerMember({
        name: "Sam",
        firstName: "Sam",
        joinedAt: new Date("2026-09-01T00:00:00Z"),
        role: "member",
        cohortStatus: "active",
        enrollmentStatus: "active",
        preparationDaysComplete: 14,
      }).stage,
    ).toBe("in_course");
  });
});
