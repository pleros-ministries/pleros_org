import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("welcome pack page", () => {
  test("shows the main gift immediately and marks supplementary packs as coming soon", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-pack-page.tsx"),
      "utf8",
    );
    const giftSource = readFileSync(
      join(process.cwd(), "lib", "welcome-pack-gifts.ts"),
      "utf8",
    );

    expect(source).toContain(
      "Find the Answer to the Most Important Question of Your Life",
    );
    expect(source).toContain("Your Greatest Burden");
    expect(source).toContain("Main gifts");
    expect(source).toContain("Extra gifts");
    expect(source).toContain("More resources are coming");
    expect(source).toContain("The supplementary packs are not ready yet");
    expect(source).not.toContain("Locked until you share");
    expect(source).not.toContain("confirmWelcomePackShareAction");
    expect(source).toContain("mainGifts");
    expect(source).toContain("extraGifts");
    expect(source).toContain("welcome-book-cover.png");
    expect(giftSource).toContain("/api/welcome-pack/download");
    expect(giftSource).toContain("/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg");
    expect(giftSource).toContain("Breaking Habits and Addictions as a New Creation");
    expect(giftSource).toContain("How the Gospel Proves Itself to Be the Truth");
    expect(source).toContain("href={gift.href}");
  });
});
