import { describe, expect, test } from "vitest";

import { normalizeEmail, validateEmail } from "./welcome-flow";

describe("welcome flow helpers", () => {
  test("normalizeEmail trims and lowercases input", () => {
    expect(normalizeEmail("  Daniel@GMAIL.com  ")).toBe("daniel@gmail.com");
  });

  test("validateEmail rejects invalid email values", () => {
    expect(validateEmail("")).toBe(false);
    expect(validateEmail("hello")).toBe(false);
    expect(validateEmail("hello@")).toBe(false);
  });

  test("validateEmail accepts valid email values", () => {
    expect(validateEmail("person@example.com")).toBe(true);
    expect(validateEmail("Person+tag@Example.org")).toBe(true);
  });
});
