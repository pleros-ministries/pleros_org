import { describe, expect, test } from "vitest";

import { extraGifts, mainGifts } from "./welcome-pack-gifts";

describe("welcome pack gift config", () => {
  test("keeps the main gift available and lists an unlocked audio companion", () => {
    expect(mainGifts.length).toBeGreaterThanOrEqual(1);
    expect(mainGifts[0]?.title).toBe("Welcome to Purpose (ebook)");
    expect(mainGifts[0]?.description).toBe("Download for offline reading.");
    expect(mainGifts[0]?.imageSrc).toBe(
      "/assets/dashboard/welcome-pack-main-gift/ebook-purpose-welcome-card.png",
    );
    expect(mainGifts[0]?.imageBackgroundColor).toBe("#016dd5");
    expect(mainGifts[0]?.href).toBe("/api/welcome-pack/download");
    expect(mainGifts[0]?.locked).toBeFalsy();

    const audioGift = mainGifts.find((gift) => gift.id === "purpose-welcome-audio");
    expect(audioGift?.title).toBe("Welcome to Purpose (Audiobook)");
    expect(audioGift?.description).toBe("Listen to the book in audio format.");
    expect(audioGift?.imageSrc).toBe(
      "/assets/dashboard/welcome-pack-main-gift/audiobook-purpose-welcome-card.png",
    );
    expect(audioGift?.imageBackgroundColor).toBe("#016dd5");
    expect(audioGift?.href).toBe("/dashboard/welcomepack/audiobook");
    expect(audioGift?.locked).toBeFalsy();
  });

  test("names the two referral extra gifts", () => {
    expect(extraGifts).toHaveLength(2);
    expect(extraGifts.map((gift) => gift.title)).toEqual([
      "Breaking Habits and Addictions as a New Creation",
      "How the Gospel Proves Itself to Be the Truth",
    ]);
    expect(extraGifts[0]?.description).toBe(
      "A transformative teaching to help you walk free of the flesh.",
    );
    expect(extraGifts[1]?.description).toBe(
      "A clear case for the gospel's claim as the truth of existence.",
    );
    expect(extraGifts.map((gift) => gift.imageBackgroundColor)).toEqual([
      "#4654dc",
      "#fffed8",
    ]);
  });

  test.each([...mainGifts, ...extraGifts])(
    "defines all required gift presentation fields for $id",
    (gift) => {
      expect(gift.title).toBeTruthy();
      expect(gift.description).toBeTruthy();
      expect(gift.imageSrc).toBeTruthy();
      expect(gift.buttonLabel).toBeTruthy();
      expect(gift.href).toBeTruthy();
    },
  );
});
