import { describe, expect, test } from "vitest";

import {
  CONTACT_SUBMISSION_MINIMUM_DURATION_MS,
  buildContactStatusUpdate,
  evaluateContactSpam,
  normalizeContactSubmissionInput,
  validateContactSubmissionInput,
} from "./contact-submissions";

describe("contact submission helpers", () => {
  test("fails when required fields are missing", () => {
    const input = normalizeContactSubmissionInput({
      fullName: "",
      email: "",
      phone: "",
      location: "",
      message: "",
    });

    expect(validateContactSubmissionInput(input)).toEqual({
      fullName: "Full name is required.",
      email: "Email is required.",
      phone: "Phone is required.",
      message: "Message is required.",
    });
  });

  test("fails when the email is invalid", () => {
    const input = normalizeContactSubmissionInput({
      fullName: "Ada Lovelace",
      email: "not-an-email",
      phone: "+234 555 1234",
      location: "Lagos",
      message: "I would like to learn more.",
    });

    expect(validateContactSubmissionInput(input)).toEqual({
      email: "Enter a valid email address.",
    });
  });

  test("allows an empty location and normalizes it to null", () => {
    const input = normalizeContactSubmissionInput({
      fullName: "Ada Lovelace",
      email: "Ada@example.com",
      phone: "+234 555 1234",
      location: "   ",
      message: "I would like to learn more.",
    });

    expect(input.location).toBeNull();
    expect(validateContactSubmissionInput(input)).toEqual({});
  });

  test("flags honeypot submissions as spam", () => {
    const result = evaluateContactSpam(
      {
        honeypot: "filled",
        formStartedAt: String(Date.UTC(2026, 5, 8, 12, 0, 0)),
      },
      {
        nowMs: Date.UTC(2026, 5, 8, 12, 0, 10),
      },
    );

    expect(result).toEqual({
      blockSubmission: true,
      formStartedAt: new Date("2026-06-08T12:00:00.000Z"),
      honeypotValue: "filled",
      isSpam: true,
      reasons: ["honeypot"],
      submitDurationMs: 10_000,
    });
  });

  test("rejects submissions that arrive too quickly", () => {
    const startMs = Date.UTC(2026, 5, 8, 12, 0, 0);
    const result = evaluateContactSpam(
      {
        honeypot: "",
        formStartedAt: String(startMs),
      },
      {
        nowMs: startMs + CONTACT_SUBMISSION_MINIMUM_DURATION_MS - 100,
      },
    );

    expect(result.isSpam).toBe(true);
    expect(result.blockSubmission).toBe(true);
    expect(result.reasons).toEqual(["submitted_too_fast"]);
    expect(result.submitDurationMs).toBe(
      CONTACT_SUBMISSION_MINIMUM_DURATION_MS - 100,
    );
  });

  test("updates timestamps as contact statuses change", () => {
    const now = new Date("2026-06-08T12:30:00.000Z");

    expect(
      buildContactStatusUpdate(
        {
          status: "new",
          readAt: null,
          resolvedAt: null,
        },
        "read",
        now,
      ),
    ).toEqual({
      status: "read",
      updatedAt: now,
      readAt: now,
      resolvedAt: null,
    });

    expect(
      buildContactStatusUpdate(
        {
          status: "read",
          readAt: new Date("2026-06-08T12:00:00.000Z"),
          resolvedAt: null,
        },
        "resolved",
        now,
      ),
    ).toEqual({
      status: "resolved",
      updatedAt: now,
      readAt: new Date("2026-06-08T12:00:00.000Z"),
      resolvedAt: now,
    });
  });
});
