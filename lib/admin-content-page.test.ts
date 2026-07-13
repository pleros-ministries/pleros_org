import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const contentPageSource = readFileSync(
  join(
    process.cwd(),
    "app",
    "admin",
    "(app)",
    "(admin-only)",
    "content",
    "page.tsx",
  ),
  "utf8",
);

const contentQuerySource = readFileSync(
  join(process.cwd(), "lib", "db", "queries", "content.ts"),
  "utf8",
);

describe("admin content page", () => {
  test("uses overview question data instead of reloading every lesson", () => {
    expect(contentPageSource).not.toContain("getLessonForEdit");
  });

  test("caches the shared content overview", () => {
    expect(contentQuerySource).toContain("unstable_cache");
  });
});
