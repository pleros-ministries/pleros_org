import { describe, expect, test } from "vitest";

import {
  buildReferralUrl,
  deriveReferralStage,
  generateReferralCode,
  referralStageLabel,
} from "./referral";

describe("generateReferralCode", () => {
  test("is 8 lowercase hex chars and varies", () => {
    const a = generateReferralCode();
    const b = generateReferralCode();
    expect(a).toMatch(/^[0-9a-f]{8}$/);
    expect(b).toMatch(/^[0-9a-f]{8}$/);
    expect(a).not.toBe(b);
  });
});

describe("buildReferralUrl", () => {
  test("points straight at the enrol form with the ref param", () => {
    expect(buildReferralUrl("https://pleros.org", "a1b2c3d4")).toBe(
      "https://pleros.org/sogp/enrol?ref=a1b2c3d4",
    );
    expect(buildReferralUrl("https://pleros.org/", "a1b2c3d4")).toBe(
      "https://pleros.org/sogp/enrol?ref=a1b2c3d4",
    );
  });
});

describe("deriveReferralStage", () => {
  test("just enrolled, nothing done", () => {
    expect(
      deriveReferralStage({
        cohortStatus: "enrollment_open",
        enrollmentStatus: "enrolled",
        preparationDaysComplete: 0,
      }),
    ).toBe("enrolled");
  });

  test("preparing once a prep day is done", () => {
    expect(
      deriveReferralStage({
        cohortStatus: "enrollment_open",
        enrollmentStatus: "enrolled",
        preparationDaysComplete: 3,
      }),
    ).toBe("preparing");
  });

  test("active cohort reads as in the course", () => {
    expect(
      deriveReferralStage({
        cohortStatus: "active",
        enrollmentStatus: "active",
        preparationDaysComplete: 14,
      }),
    ).toBe("in_course");
  });

  test("completed enrolment wins regardless of cohort", () => {
    expect(
      deriveReferralStage({
        cohortStatus: "active",
        enrollmentStatus: "completed",
        preparationDaysComplete: 14,
      }),
    ).toBe("completed");
  });

  test("labels are sentence case", () => {
    expect(referralStageLabel("in_course")).toBe("In the course");
    expect(referralStageLabel("enrolled")).toBe("Enrolled");
  });
});
