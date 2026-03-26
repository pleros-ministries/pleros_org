import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("home alias route", () => {
  test("defines /home as an explicit alias to the root homepage", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "home", "page.tsx"),
      "utf8",
    );

    expect(source).toContain('redirect("/")');
  });
});
