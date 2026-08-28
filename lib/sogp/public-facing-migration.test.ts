import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const publicFiles = [
  "lib/site-homepage-content.ts",
  "components/site/site-header.tsx",
  "components/site/site-footer.tsx",
  "components/home/welcome-pack-modal.tsx",
  "components/home/fulfill-page-view.tsx",
  "lib/fulfill-page-content.ts",
  "app/(site)/[slug]/page.tsx",
  "app/(site)/fulfil/page.tsx",
];

describe("learner-facing PPC retirement", () => {
  test.each(publicFiles)("removes PPC naming and links from %s", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    expect(source).not.toMatch(/\bPPC\b|Pleros Perfecting Course|href=["']\/ppc/);
  });

  test("uses SOGP language in student notification copy", () => {
    const source = readFileSync(
      join(process.cwd(), "lib", "ppc-notifications.ts"),
      "utf8",
    );
    expect(source).toContain("SOGP course reminders");
    expect(source).not.toContain("PPC course reminders");
  });
});
