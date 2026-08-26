import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

const files = [
  "components/sogp/sogp-landing-page.tsx",
  "components/sogp/sogp-enrollment-page.tsx",
  "components/sogp/sogp-dashboard.tsx",
  "components/sogp/sogp-dashboard-skeleton.tsx",
  "components/sogp/sogp-day-view.tsx",
  "components/sogp/sogp-error-boundary.tsx",
  "components/sogp/sogp-quiz.tsx",
  "components/sogp/sogp-written-response.tsx",
  "app/(site)/dashboard/sogp/certificate/page.tsx",
];

test("every SOGP page shell applies responsive horizontal gutters", () => {
  for (const file of files) {
    const source = readFileSync(join(process.cwd(), file), "utf8");
    const shellClassCount = source.match(/site-shell-page/g)?.length ?? 0;
    const gutterClassCount = source.match(/sogp-shell-page/g)?.length ?? 0;
    expect(gutterClassCount, file).toBe(shellClassCount);
  }
});

test("SOGP gutter utility uses existing public shell tokens", () => {
  const globals = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  expect(globals).toContain(".site-font-theme .sogp-shell-page");
  expect(globals).toContain("padding-inline: var(--site-shell-padding-x)");
  expect(globals).toContain(
    ".site-font-theme .sogp-shell-page {\n      max-width: none;\n      padding-inline: calc(var(--site-shell-padding-x-lg) + 1.5rem);",
  );
  expect(globals).toContain(
    "padding-inline: calc(var(--site-shell-padding-x-xl) + 2rem);",
  );
});
