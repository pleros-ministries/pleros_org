import { describe, expect, test } from "vitest";

import { deriveSogpLearnerState } from "./status";

describe("deriveSogpLearnerState", () => {
  test.each([
    ["preparing", "preparing"],
    ["active", "active"],
    ["completed", "carryover"],
  ] as const)("maps %s cohort to %s learner state", (cohortStatus, expected) => {
    expect(
      deriveSogpLearnerState({
        cohortStatus,
        enrollmentStatus: "enrolled",
      }),
    ).toBe(expected);
  });

  test("preserves terminal enrollment states", () => {
    expect(
      deriveSogpLearnerState({
        cohortStatus: "active",
        enrollmentStatus: "completed",
      }),
    ).toBe("completed");
    expect(
      deriveSogpLearnerState({
        cohortStatus: "active",
        enrollmentStatus: "withdrawn",
      }),
    ).toBe("withdrawn");
  });
});
