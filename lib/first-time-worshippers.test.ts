import { describe, expect, test } from "vitest";

import {
  getFirstTimeWorshipperSheetName,
  normalizeFirstTimeWorshipperInput,
  validateFirstTimeWorshipperInput,
} from "./first-time-worshippers";

describe("first-time worshipper input", () => {
  test("normalizes and accepts a visitor for an FCC location", () => {
    const values = normalizeFirstTimeWorshipperInput({
      fullName: "  Ada Okafor ",
      phone: " 0801 234 5678 ",
      email: " ADA@EXAMPLE.COM ",
      location: "Lagos",
    });

    expect(values).toEqual({
      fullName: "Ada Okafor",
      phone: "0801 234 5678",
      email: "ada@example.com",
      location: "Lagos",
    });
    expect(validateFirstTimeWorshipperInput(values)).toEqual({});
  });

  test("requires contact details and one of the listed FCC locations", () => {
    expect(
      validateFirstTimeWorshipperInput({
        fullName: "",
        phone: "",
        email: "not-an-email",
        location: "Elsewhere",
      }),
    ).toEqual({
      fullName: "Full name is required.",
      phone: "Phone number is required.",
      email: "Enter a valid email address.",
      location: "Choose one of our church locations.",
    });
  });

  test("maps Ile-Ife to the requested Ife tab", () => {
    expect(getFirstTimeWorshipperSheetName("Ile-Ife")).toBe("Ife");
    expect(getFirstTimeWorshipperSheetName("Ibadan")).toBe("Ibadan");
  });
});
