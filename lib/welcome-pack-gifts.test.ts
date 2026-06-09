import { describe, expect, test } from "vitest";

import { extraGifts, mainGifts } from "./welcome-pack-gifts";

describe("welcome pack gift config", () => {
  test("keeps main gifts flexible and extra gifts exactly two for the v1 unlock flow", () => {
    expect(mainGifts.length).toBeGreaterThanOrEqual(1);
    expect(extraGifts).toHaveLength(2);
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
