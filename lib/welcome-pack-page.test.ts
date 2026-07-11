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

    expect(source).toContain("Access your Welcome Pack here");
    expect(source).toContain("Main gifts");
    expect(source).toContain("More resources are coming");
    expect(source).toContain("The supplementary packs are not ready yet");
    expect(source).not.toContain("Locked until you share");
    expect(source).not.toContain("confirmWelcomePackShareAction");
    expect(source).toContain("mainGifts");
    expect(source).toContain("extraGifts");
    expect(giftSource).toContain("/api/welcome-pack/download");
    expect(giftSource).toContain("/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg");
    expect(giftSource).toContain("export const extraGifts: WelcomePackGift[] = [];");
    expect(source).toContain("href={gift.href}");
  });
});
