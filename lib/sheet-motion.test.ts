import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("sheet motion", () => {
  test("uses a gentle off-canvas transform for drawer entry", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "ui", "sheet.tsx"),
      "utf8",
    );

    expect(source).toContain("duration-[320ms]");
    expect(source).toContain("cubic-bezier(0.22,1,0.36,1)");
    expect(source).toContain("data-closed:-translate-x-full");
    expect(source).toContain("data-closed:translate-x-full");
    expect(source).not.toContain("data-closed:-translate-x-8");
    expect(source).not.toContain("data-closed:translate-x-8");
  });
});
