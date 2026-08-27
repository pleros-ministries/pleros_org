import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("keeps the enrolment page focused with a compact summary list", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-enrollment-page.tsx"),
    "utf8",
  );

  expect(source).not.toContain("20 tracks");
  expect(source).not.toContain("HomepageNav");
  expect(source).not.toContain("School of God&apos;s Purpose</p>");
  expect(source).not.toContain("border-b border-[var(--color-line)] bg-[var(--color-brand-sky)]");
  // The summary reads as a tight icon list rather than a tall square grid.
  expect(source).not.toContain("aspect-square");
  expect(source).not.toContain("grid-cols-2");
  expect(source).toContain("<ul className=\"grid gap-3\">");
});
