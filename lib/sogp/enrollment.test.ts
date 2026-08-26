import { describe, expect, test } from "vitest";

import {
  buildSogpEnrollmentRedirect,
  normalizeSogpEnrollment,
  validateSogpEnrollment,
} from "./enrollment";

describe("SOGP enrolment", () => {
  test("redirects successful enrolments to the configured Telegram channel", () => {
    expect(
      buildSogpEnrollmentRedirect({
        cohortChannelUrl: " https://t.me/cohort_channel ",
        configuredChannelUrl: "https://t.me/default_channel",
      }),
    ).toEqual({
      redirectTo: "https://t.me/cohort_channel",
      telegramUrl: "https://t.me/cohort_channel",
    });
    expect(
      buildSogpEnrollmentRedirect({
        configuredChannelUrl: " https://t.me/pleros_sogp ",
      }),
    ).toEqual({
      redirectTo: "https://t.me/pleros_sogp",
      telegramUrl: "https://t.me/pleros_sogp",
    });
    expect(buildSogpEnrollmentRedirect({})).toBeNull();
  });

  test("normalizes valid input and bounded attribution", () => {
    expect(
      normalizeSogpEnrollment({
        name: "  Ada Grace ",
        email: " ADA@EXAMPLE.COM ",
        phone: " 0803 000 0000 ",
        phoneCountryCode: "NG",
        countryCode: " ng ",
        country: " Nigeria ",
        region: " Lagos ",
        birthYear: " 1998 ",
        reason: " I want clarity. ",
        utmSource: " meta ",
      }),
    ).toMatchObject({
      firstName: "Ada",
      lastName: "Grace",
      name: "Ada Grace",
      email: "ada@example.com",
      phone: "+2348030000000",
      countryCode: "NG",
      country: "Nigeria",
      region: "Lagos",
      birthYear: "1998",
      reason: "I want clarity.",
      utmSource: "meta",
    });
  });

  test("derives first and last name from a single full-name field", () => {
    expect(
      normalizeSogpEnrollment({ name: "  Mary   Jane  Watson " }),
    ).toMatchObject({
      firstName: "Mary",
      lastName: "Jane Watson",
      name: "Mary Jane Watson",
    });
    expect(normalizeSogpEnrollment({ name: "Prince" })).toMatchObject({
      firstName: "Prince",
      lastName: "",
      name: "Prince",
    });
  });

  test("reports required and malformed fields", () => {
    expect(
      validateSogpEnrollment(
        normalizeSogpEnrollment({
          name: "",
          email: "bad",
          phone: "12",
          countryCode: "",
          country: "",
          region: "",
          reason: "",
        }),
      ),
    ).toEqual({
      name: "Enter your full name.",
      email: "Enter a valid email address.",
      phone: "Enter a valid phone number.",
      countryCode: "Country is required.",
      country: "Country is required.",
      region: "State, province or region is required.",
      birthYear: "Year of birth is required.",
    });
  });

  test("rejects birth years outside a plausible range", () => {
    const base = {
      name: "Ada Grace",
      email: "ada@example.com",
      phone: "+2348030000000",
      countryCode: "NG",
      country: "Nigeria",
      region: "Lagos",
    };
    const thisYear = new Date().getUTCFullYear();

    expect(
      validateSogpEnrollment(
        normalizeSogpEnrollment({ ...base, birthYear: "1899" }),
      ).birthYear,
    ).toBeDefined();
    expect(
      validateSogpEnrollment(
        normalizeSogpEnrollment({ ...base, birthYear: String(thisYear) }),
      ).birthYear,
    ).toBeDefined();
    expect(
      validateSogpEnrollment(
        normalizeSogpEnrollment({ ...base, birthYear: "1998" }),
      ).birthYear,
    ).toBeUndefined();
  });

  test("rejects an overlong reason", () => {
    const input = normalizeSogpEnrollment({
      name: "Ada Grace",
      email: "ada@example.com",
      phone: "+2348030000000",
      countryCode: "NG",
      country: "Nigeria",
      region: "Lagos",
      birthYear: "1998",
      reason: "x".repeat(1_001),
    });

    expect(validateSogpEnrollment(input).reason).toBe(
      "Keep your response within 1,000 characters.",
    );
  });
});
