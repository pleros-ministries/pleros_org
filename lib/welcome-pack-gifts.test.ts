import { describe, expect, test } from "vitest";

import { extraGifts, mainGifts } from "./welcome-pack-gifts";

describe("welcome pack gift config", () => {
  test("keeps the main gift available and lists a locked audio companion", () => {
    expect(mainGifts.length).toBeGreaterThanOrEqual(1);
    expect(mainGifts[0]?.href).toBe("/api/welcome-pack/download");
    expect(mainGifts[0]?.locked).toBeFalsy();

    const audioGift = mainGifts.find((gift) => gift.id === "purpose-welcome-audio");
    expect(audioGift?.locked).toBe(true);
  });

  test("names the two referral extra gifts", () => {
    expect(extraGifts).toHaveLength(2);
    expect(extraGifts.map((gift) => gift.title)).toEqual([
      "Breaking Habits and Addictions as a New Creation",
      "How the Gospel Proves Itself to Be the Truth",
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
