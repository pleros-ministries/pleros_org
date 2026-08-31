import { expect, test } from "vitest";

import { normalizeWelcomeReturnTo } from "./welcome-session";

test("limits welcome return targets to internal paths", () => {
  expect(normalizeWelcomeReturnTo("/dashboard")).toBe("/dashboard");
  expect(normalizeWelcomeReturnTo("/thankyou", "/thankyou")).toBe(
    "/thankyou",
  );
  expect(normalizeWelcomeReturnTo("https://example.com")).toBe("/dashboard");
  expect(normalizeWelcomeReturnTo("//evil.test")).toBe("/dashboard");
  expect(normalizeWelcomeReturnTo("dashboard")).toBe("/dashboard");
  expect(normalizeWelcomeReturnTo(undefined)).toBe("/dashboard");
});
