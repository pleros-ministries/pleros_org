import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("PPC auth shell", () => {
  test("keeps the auth nav flat without a drop shadow", () => {
    const globals = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const navRule = globals.match(/\.pleros-nav\s*\{[^}]+\}/)?.[0] ?? "";

    expect(navRule).toContain("background: #011585");
    expect(navRule).not.toContain("box-shadow");
  });
});
