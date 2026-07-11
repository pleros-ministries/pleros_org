import { describe, expect, test } from "vitest";

import { extraGifts, mainGifts } from "./welcome-pack-gifts";

describe("welcome pack gift config", () => {
  test("keeps the main gift available while supplementary packs are pending", () => {
    expect(mainGifts.length).toBeGreaterThanOrEqual(1);
    expect(mainGifts[0]?.href).toBe("/api/welcome-pack/download");
    expect(extraGifts).toHaveLength(0);
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
