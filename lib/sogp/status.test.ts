import { describe, expect, test } from "vitest";

import { canOfferJoinAnotherCohort, deriveSogpLearnerState } from "./status";

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

describe("canOfferJoinAnotherCohort", () => {
  test("false when there is no open cohort", () => {
    expect(
      canOfferJoinAnotherCohort(
        [{ enrollment: { cohortId: 1 }, cohort: { status: "completed" } }],
        null,
      ),
    ).toBe(false);
  });

  test("false when any enrollment's cohort has not completed", () => {
    expect(
      canOfferJoinAnotherCohort(
        [
          { enrollment: { cohortId: 1 }, cohort: { status: "completed" } },
          { enrollment: { cohortId: 2 }, cohort: { status: "active" } },
        ],
        3,
      ),
    ).toBe(false);
  });

  test("false when already enrolled in the open cohort", () => {
    expect(
      canOfferJoinAnotherCohort(
        [{ enrollment: { cohortId: 3 }, cohort: { status: "completed" } }],
        3,
      ),
    ).toBe(false);
  });

  test("true when every enrollment is completed and the open cohort is new", () => {
    expect(
      canOfferJoinAnotherCohort(
        [{ enrollment: { cohortId: 1 }, cohort: { status: "completed" } }],
        3,
      ),
    ).toBe(true);
  });
});
