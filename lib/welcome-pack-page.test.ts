import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("welcome pack page", () => {
  test("shows main gifts immediately and extra gifts behind the trust-based unlock", () => {
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
    expect(source).toContain("Extra gifts");
    expect(source).toContain("Locked until you share");
    expect(source).toContain("confirmWelcomePackShareAction");
    expect(source).toContain("mainGifts");
    expect(source).toContain("extraGifts");
    expect(giftSource).toContain("/site/home/assets/welcome-pack-cards/ga-welcome-card.svg");
    expect(giftSource).toContain("/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg");
    expect(source).toContain("href={gift.href}");
  });
});
