import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("welcome pack page", () => {
  test("leads with orientation media, Telegram, and visual navigation", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-pack-page.tsx"),
      "utf8",
    );

    expect(source).toContain('id="welcome-orientation"');
    expect(source).toContain("sogp-welcome-WaXgk9zqi78.mp4");
    expect(source).toContain("Join the orientation group");
    expect(source).toContain("https://t.me/pleros_sogp");
    expect(source).toContain("Orientation video");
    expect(source).toContain("Your gifts");
    expect(source).toContain('id="welcome-gifts"');
  });

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
    expect(source).not.toContain("Your main welcome pack is ready now");
    expect(source).not.toContain("We'll add supplementary");
    expect(source).toContain("container-pleros");
    expect(source).toContain("max-w-[36rem]");
    expect(source).not.toContain(
      "Find the Answer to the Most Important Question of Your Life",
    );
    expect(source).not.toContain("welcomePackContentFrame");
    expect(source).not.toContain("welcome-book-cover.png");
    expect(source).not.toContain("Your Greatest Burden");
    expect(source).toContain("Main gifts");
    expect(source).toContain("Extra gifts");
    expect(source).toContain("More resources are coming");
    expect(source).toContain("The supplementary packs are not ready yet");
    expect(source).toContain("Your next step");
    expect(source).toContain("Go to your dashboard");
    expect(source).toContain("teachings, devotion, and accountability");
    expect(source).toContain('href="/dashboard"');
    expect(source).toContain("gift.imageBackgroundColor");
    expect(source).toContain("backgroundColor: gift.imageBackgroundColor");
    expect(source).toContain("bg-[rgba(6,16,86,0.1)]");
    expect(source).not.toContain("Locked until you share");
    expect(source).not.toContain("confirmWelcomePackShareAction");
    expect(source).toContain("mainGifts");
    expect(source).toContain("extraGifts");
    expect(source).toContain("HomepageCommunitySection");
    expect(source).not.toContain("homeWhatsappChannelUrl");
    expect(giftSource).toContain("/api/welcome-pack/download");
    expect(giftSource).toContain(
      "/assets/dashboard/welcome-pack-main-gift/ebook-purpose-welcome-card.png",
    );
    expect(giftSource).toContain(
      "/assets/dashboard/welcome-pack-main-gift/audiobook-purpose-welcome-card.png",
    );
    expect(giftSource).toContain("Breaking Habits and Addictions as a New Creation");
    expect(giftSource).toContain("How the Gospel Proves Itself to Be the Truth");
    expect(source).toContain("href={gift.href}");
  });
});
