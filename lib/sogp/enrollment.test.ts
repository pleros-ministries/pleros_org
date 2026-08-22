import { describe, expect, test } from "vitest";

import {
  normalizeSogpEnrollment,
  validateSogpEnrollment,
} from "./enrollment";

describe("SOGP enrolment", () => {
  test("normalizes valid input and bounded attribution", () => {
    expect(
      normalizeSogpEnrollment({
        name: "  Ada Grace ",
        email: " ADA@EXAMPLE.COM ",
        phone: " +234 803 000 0000 ",
        country: " Nigeria ",
        reason: " I want clarity. ",
        utmSource: " meta ",
      }),
    ).toMatchObject({
      name: "Ada Grace",
      email: "ada@example.com",
      phone: "+234 803 000 0000",
      country: "Nigeria",
      reason: "I want clarity.",
      utmSource: "meta",
    });
  });

  test("reports required and malformed fields", () => {
    expect(
      validateSogpEnrollment(
        normalizeSogpEnrollment({
          name: "",
          email: "bad",
          phone: "12",
          country: "",
          reason: "",
        }),
      ),
    ).toEqual({
      name: "Full name is required.",
      email: "Enter a valid email address.",
      phone: "Enter a valid WhatsApp number.",
      country: "Country is required.",
    });
  });

  test("rejects an overlong reason", () => {
    const input = normalizeSogpEnrollment({
      name: "Ada Grace",
      email: "ada@example.com",
      phone: "+2348030000000",
      country: "Nigeria",
      reason: "x".repeat(1_001),
    });

    expect(validateSogpEnrollment(input).reason).toBe(
      "Keep your response within 1,000 characters.",
    );
  });
});
