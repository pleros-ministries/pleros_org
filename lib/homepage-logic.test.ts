import { describe, expect, test } from "vitest";

import {
  WELCOME_PACK_STORAGE_KEY,
  buildWelcomePackDownloads,
  getNextCarouselIndex,
  readWelcomePackState,
  serializeWelcomePackState,
  shouldShowWelcomePackModal,
} from "./homepage-logic";

describe("homepage logic", () => {
  test("getNextCarouselIndex advances and wraps", () => {
    expect(getNextCarouselIndex(0, 3)).toBe(1);
    expect(getNextCarouselIndex(1, 3)).toBe(2);
    expect(getNextCarouselIndex(2, 3)).toBe(0);
  });

  test("getNextCarouselIndex handles empty total safely", () => {
    expect(getNextCarouselIndex(2, 0)).toBe(0);
  });

  test("readWelcomePackState parses supported states", () => {
    const dismissed = readWelcomePackState(
      JSON.stringify({ status: "dismissed", updatedAt: "2026-03-11T00:00:00.000Z" }),
    );
    const completed = readWelcomePackState(
      JSON.stringify({
        status: "completed",
        email: "person@example.com",
        updatedAt: "2026-03-11T00:00:00.000Z",
      }),
    );

    expect(dismissed?.status).toBe("dismissed");
    expect(completed?.status).toBe("completed");
    expect(completed?.email).toBe("person@example.com");
  });

  test("shouldShowWelcomePackModal only when persistence is absent/invalid", () => {
    expect(shouldShowWelcomePackModal(null)).toBe(true);
    expect(shouldShowWelcomePackModal("bad-json")).toBe(true);

    const persisted = serializeWelcomePackState({
      status: "dismissed",
      updatedAt: "2026-03-11T00:00:00.000Z",
    });

    expect(shouldShowWelcomePackModal(persisted)).toBe(false);
  });

  test("buildWelcomePackDownloads returns two download payloads", () => {
    const payloads = buildWelcomePackDownloads("person@example.com");

    expect(payloads).toHaveLength(2);
    expect(payloads[0].fileName).toContain("welcome-pack-ebook-1");
    expect(payloads[1].fileName).toContain("welcome-pack-ebook-2");
    expect(payloads[0].content).toContain("person@example.com");
    expect(payloads[1].content).toContain("person@example.com");
  });

  test("storage key is stable", () => {
    expect(WELCOME_PACK_STORAGE_KEY).toBe("pleros.welcome-pack.state");
  });
});
