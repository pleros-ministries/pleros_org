import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("welcome pack page", () => {
  test("matches the screenshot copy and uses the local SVG cards as the primary content", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-pack-page.tsx"),
      "utf8",
    );

    expect(source).toContain("Access your Welcome Pack here");
    expect(source).toContain("We&apos;re glad to have you!");
    expect(source).toContain("/site/home/assets/welcome-pack-cards/ga-welcome-card.svg");
    expect(source).toContain("/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg");
    expect(source).toContain('bg-[var(--color-surface)] pb-10 pt-5 sm:pb-12 sm:pt-6');
    expect(source).toContain("grid grid-cols-2");
    expect(source).toContain('text-[clamp(2.4rem,6.2vw,3.45rem)]');
    expect(source).not.toContain("Back to dashboard");
    expect(source).not.toContain("Your welcome pack is ready.");
    expect(source).not.toContain("<article");
    expect(source).not.toContain("href: ");
    expect(source).not.toContain("<Link");
    expect(source).not.toContain('from "@/components/ui/card"');
  });
});
