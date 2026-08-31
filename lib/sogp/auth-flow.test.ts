import { createHmac } from "node:crypto";
import { describe, expect, test } from "vitest";

import {
  SOGP_OTP_RESEND_SECONDS,
  SOGP_SETUP_COOKIE,
  canSendSogpCode,
  hashSogpFlowToken,
  isSogpSetupExpired,
  normalizeLearnerReturnTo,
  validateLearnerPassword,
} from "./auth-flow";

describe("SOGP authentication flow", () => {
  test("accepts only same-origin dashboard return paths", () => {
    expect(normalizeLearnerReturnTo("/dashboard/sogp?day=2")).toBe(
      "/dashboard/sogp?day=2",
    );
    expect(normalizeLearnerReturnTo("/dashboard")).toBe("/dashboard");

    for (const unsafe of [
      "//evil.example/dashboard",
      "https://evil.example/dashboard",
      "/dashboard\\evil",
      "/dashboard-evil",
      "/welcome",
      "%2F%2Fevil.example",
    ]) {
      expect(normalizeLearnerReturnTo(unsafe)).toBe("/dashboard");
    }
  });

  test("hashes opaque flow tokens without storing the raw token", () => {
    const token = "raw-flow-token";
    const secret = "test-secret";
    const hash = hashSogpFlowToken(token, secret);

    expect(hash).not.toContain(token);
    expect(hash).toBe(
      createHmac("sha256", secret).update(token).digest("hex"),
    );
    expect(SOGP_SETUP_COOKIE).toBe("pleros_sogp_setup_v1");
  });

  test("validates learner password length and confirmation", () => {
    expect(validateLearnerPassword("short", "short")).toEqual({
      password: "Password must be at least 8 characters.",
    });
    expect(validateLearnerPassword("a".repeat(129), "a".repeat(129))).toEqual({
      password: "Password must be 128 characters or fewer.",
    });
    expect(validateLearnerPassword("valid-password", "different-password")).toEqual({
      confirmation: "Passwords do not match.",
    });
    expect(validateLearnerPassword("valid-password", "valid-password")).toEqual({});
  });

  test("enforces code resend cooldown and flow expiry", () => {
    const now = new Date("2026-08-31T10:00:00.000Z");

    expect(SOGP_OTP_RESEND_SECONDS).toBe(60);
    expect(canSendSogpCode({ sentAt: null, sendCount: 0 }, now)).toBe(true);
    expect(
      canSendSogpCode(
        { sentAt: new Date("2026-08-31T09:59:30.000Z"), sendCount: 1 },
        now,
      ),
    ).toBe(false);
    expect(
      canSendSogpCode(
        { sentAt: new Date("2026-08-31T09:58:00.000Z"), sendCount: 5 },
        now,
      ),
    ).toBe(false);
    expect(
      canSendSogpCode(
        { sentAt: new Date("2026-08-31T09:58:00.000Z"), sendCount: 2 },
        now,
      ),
    ).toBe(true);

    expect(isSogpSetupExpired(new Date("2026-08-31T09:59:59.000Z"), now)).toBe(
      true,
    );
    expect(isSogpSetupExpired(new Date("2026-08-31T10:00:01.000Z"), now)).toBe(
      false,
    );
  });
});
