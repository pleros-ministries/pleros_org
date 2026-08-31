import { describe, expect, test } from "vitest";

import {
  getSogpOtpPurpose,
  validateSogpSetupCompletion,
} from "./enrollment-auth";

describe("SOGP enrolment authentication state", () => {
  test("selects email verification for new/unverified users and sign-in for verified users", () => {
    expect(getSogpOtpPurpose(null)).toBe("email_verification");
    expect(getSogpOtpPurpose({ emailVerified: false })).toBe(
      "email_verification",
    );
    expect(getSogpOtpPurpose({ emailVerified: true })).toBe("sign_in");
  });

  test("requires a verified live flow and matching session email", () => {
    const base = {
      email: "learner@example.com",
      expiresAt: new Date("2026-08-31T11:00:00.000Z"),
      verifiedAt: new Date("2026-08-31T10:00:00.000Z"),
      completedAt: null,
    };
    const now = new Date("2026-08-31T10:30:00.000Z");

    expect(
      validateSogpSetupCompletion(base, "LEARNER@example.com", now),
    ).toEqual({ ok: true });
    expect(validateSogpSetupCompletion(base, "other@example.com", now)).toEqual({
      ok: false,
      reason: "email_mismatch",
    });
    expect(
      validateSogpSetupCompletion({ ...base, verifiedAt: null }, base.email, now),
    ).toEqual({ ok: false, reason: "not_verified" });
    expect(
      validateSogpSetupCompletion(
        { ...base, expiresAt: new Date("2026-08-31T10:00:00.000Z") },
        base.email,
        now,
      ),
    ).toEqual({ ok: false, reason: "expired" });
    expect(
      validateSogpSetupCompletion(
        { ...base, completedAt: new Date("2026-08-31T10:10:00.000Z") },
        base.email,
        now,
      ),
    ).toEqual({ ok: false, reason: "completed" });
  });
});
