import { describe, expect, test } from "vitest";

import {
  buildDashboardHref,
  getGreetingName,
  normalizeEmail,
  validateEmail,
} from "./welcome-flow";

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

  test("buildDashboardHref returns encoded dashboard route with email", () => {
    expect(buildDashboardHref("first.last+podcast@example.com")).toBe(
      "/dashboard?email=first.last%2Bpodcast%40example.com",
    );
  });

  test("getGreetingName derives first name and falls back to Friend", () => {
    expect(getGreetingName("daniel@pleros.org")).toBe("Daniel");
    expect(getGreetingName("")).toBe("Friend");
  });
});
