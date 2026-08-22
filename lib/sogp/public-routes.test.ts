import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("SOGP public routes", () => {
  test("uses only canonical /sogp public pages", () => {
    const landing = join(root, "app", "(site)", "sogp", "page.tsx");
    const enroll = join(root, "app", "(site)", "sogp", "enroll", "page.tsx");
    expect(existsSync(landing)).toBe(true);
    expect(existsSync(enroll)).toBe(true);
    expect(
      existsSync(join(root, "app", "(site)", "school-of-purpose")),
    ).toBe(false);
  });

  test("landing CTA opens enrolment page", () => {
    const source = readFileSync(
      join(root, "lib", "sogp", "landing-content.ts"),
      "utf8",
    );
    expect(source).toContain('ctaHref: "/sogp/enroll"');
  });
});
