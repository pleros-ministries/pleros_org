import { existsSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("migrates the learner route permanently to /dashboard/sogp", () => {
  expect(
    existsSync(join(process.cwd(), "app", "(site)", "dashboard", "sogp", "page.tsx")),
  ).toBe(true);
  expect(
    existsSync(
      join(
        process.cwd(),
        "app",
        "(site)",
        "dashboard",
        "school-of-purpose",
        "page.tsx",
      ),
    ),
  ).toBe(false);
});
