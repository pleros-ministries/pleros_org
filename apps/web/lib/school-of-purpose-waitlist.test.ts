import { describe, expect, test } from "vitest";

import {
  normalizeSchoolOfPurposeWaitlistInput,
  validateSchoolOfPurposeWaitlistInput,
} from "./school-of-purpose-waitlist";

describe("normalizeSchoolOfPurposeWaitlistInput", () => {
  test("trims whitespace", () => {
    expect(
      normalizeSchoolOfPurposeWaitlistInput({
        name: "  Ada Grace  ",
        phone: " +234 803 000 0000 ",
      }),
    ).toEqual({ name: "Ada Grace", phone: "+234 803 000 0000" });
  });
});

describe("validateSchoolOfPurposeWaitlistInput", () => {
  test("passes for a valid name and phone", () => {
    expect(
      validateSchoolOfPurposeWaitlistInput({
        name: "Ada Grace",
        phone: "+2348030000000",
      }),
    ).toEqual({});
  });

  test("requires a name", () => {
    expect(
      validateSchoolOfPurposeWaitlistInput({ name: "", phone: "+2348030000000" }),
    ).toEqual({ name: "Name is required." });
  });

  test("requires a phone number", () => {
    expect(
      validateSchoolOfPurposeWaitlistInput({ name: "Ada Grace", phone: "" }),
    ).toEqual({ phone: "WhatsApp number is required." });
  });

  test("rejects malformed phone numbers", () => {
    expect(
      validateSchoolOfPurposeWaitlistInput({ name: "Ada Grace", phone: "abc" }),
    ).toEqual({ phone: "Enter a valid WhatsApp number." });

    expect(
      validateSchoolOfPurposeWaitlistInput({ name: "Ada Grace", phone: "12" }),
    ).toEqual({ phone: "Enter a valid WhatsApp number." });
  });
});
