import { describe, expect, test } from "vitest";

import {
  buildSogpEnrollmentRedirect,
  getSogpBirthYearOptions,
  normalizeSogpEnrollment,
  validateSogpEnrollment,
} from "./enrollment";

describe("SOGP enrolment", () => {
  test("offers a controlled descending list of birth years", () => {
    const years = getSogpBirthYearOptions(2026);
    expect(years[0]).toBe("2016");
    expect(years.at(-1)).toBe("1900");
  });

  test("redirects successful enrolments to the Welcome Pack introduction", () => {
    expect(
      buildSogpEnrollmentRedirect({
        cohortChannelUrl: " https://t.me/cohort_channel ",
        configuredChannelUrl: "https://t.me/default_channel",
      }),
    ).toEqual({
      redirectTo: "/dashboard/welcomepack/join",
      telegramUrl: "https://t.me/cohort_channel",
    });
    expect(
      buildSogpEnrollmentRedirect({
        configuredChannelUrl: " https://t.me/pleros_sogp ",
      }),
    ).toEqual({
      redirectTo: "/dashboard/welcomepack/join",
      telegramUrl: "https://t.me/pleros_sogp",
    });
    expect(buildSogpEnrollmentRedirect({})).toBeNull();
  });

  test("normalizes valid input and bounded attribution", () => {
    expect(
      normalizeSogpEnrollment({
        firstName: "  Ada ",
        lastName: " Grace ",
        email: " ADA@EXAMPLE.COM ",
        phone: " 0803 000 0000 ",
        phoneCountryCode: "NG",
        countryCode: " ng ",
        country: " Nigeria ",
        region: " Lagos ",
        birthYear: " 1998 ",
        referralSource: "social_media",
        whatsappConsent: "yes",
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
      referralSource: "social_media",
      whatsappConsent: true,
      utmSource: "meta",
    });
  });

  test("keeps WhatsApp reminders opt-in explicit", () => {
    expect(normalizeSogpEnrollment({}).whatsappConsent).toBeNull();
    expect(
      normalizeSogpEnrollment({ whatsappConsent: "yes" }).whatsappConsent,
    ).toBe(true);
    expect(
      normalizeSogpEnrollment({ whatsappConsent: "no" }).whatsappConsent,
    ).toBe(false);
  });

  test("combines separate first name and surname fields", () => {
    expect(
      normalizeSogpEnrollment({
        firstName: "  Mary Jane ",
        lastName: " Watson ",
      }),
    ).toMatchObject({
      firstName: "Mary Jane",
      lastName: "Watson",
      name: "Mary Jane Watson",
    });
    expect(normalizeSogpEnrollment({ firstName: "Prince" })).toMatchObject({
      firstName: "Prince",
      lastName: "",
      name: "Prince",
    });
  });

  test("reports required and malformed fields", () => {
    expect(
      validateSogpEnrollment(
        normalizeSogpEnrollment({
          firstName: "",
          lastName: "",
          email: "bad",
          phone: "12",
          countryCode: "",
          country: "",
          region: "",
          referralSource: "",
        }),
      ),
    ).toEqual({
      firstName: "Enter your first name.",
      lastName: "Enter your surname.",
      email: "Enter a valid email address.",
      phone: "Enter a valid phone number.",
      countryCode: "Country is required.",
      country: "Country is required.",
      region: "State, province or region of residence is required.",
      birthYear: "Year of birth is required.",
      referralSource: "Select how you heard about us.",
      whatsappConsent: "Select whether you want WhatsApp reminders.",
    });
  });

  test("rejects birth years outside a plausible range", () => {
    const base = {
      firstName: "Ada",
      lastName: "Grace",
      email: "ada@example.com",
      phone: "+2348030000000",
      countryCode: "NG",
      country: "Nigeria",
      region: "Lagos",
      referralSource: "friend_or_family",
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

  test("rejects an unknown referral source", () => {
    const input = normalizeSogpEnrollment({
      firstName: "Ada",
      lastName: "Grace",
      email: "ada@example.com",
      phone: "+2348030000000",
      countryCode: "NG",
      country: "Nigeria",
      region: "Lagos",
      birthYear: "1998",
      referralSource: "word_of_mouth_or_something",
    });

    expect(validateSogpEnrollment(input).referralSource).toBe(
      "Select how you heard about us.",
    );
  });
});
