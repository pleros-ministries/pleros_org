import { describe, expect, test } from "vitest";

import {
  WELCOME_PACK_STORAGE_KEY,
  buildWelcomePackDownloads,
  readWelcomePackState,
  serializeWelcomePackState,
  shouldShowWelcomePackModal,
} from "./homepage-logic";

describe("homepage welcome gift logic", () => {
  test("keeps the public homepage storage key stable", () => {
    expect(WELCOME_PACK_STORAGE_KEY).toBe("pleros.welcome-pack.state");
  });

  test("shows the drawer when there is no stored state", () => {
    expect(shouldShowWelcomePackModal(null)).toBe(true);
  });

  test("parses completed state and stops showing the drawer", () => {
    const raw = serializeWelcomePackState({
      status: "completed",
      email: "hello@example.com",
      updatedAt: "2026-03-24T00:00:00.000Z",
    });

    expect(readWelcomePackState(raw)).toEqual({
      status: "completed",
      email: "hello@example.com",
      updatedAt: "2026-03-24T00:00:00.000Z",
    });
    expect(shouldShowWelcomePackModal(raw)).toBe(false);
  });

  test("keeps showing the drawer after a dismissal until submission is completed", () => {
    const raw = serializeWelcomePackState({
      status: "dismissed",
      updatedAt: "2026-03-24T00:00:00.000Z",
    });

    expect(readWelcomePackState(raw)).toEqual({
      status: "dismissed",
      updatedAt: "2026-03-24T00:00:00.000Z",
    });
    expect(shouldShowWelcomePackModal(raw)).toBe(true);
  });

  test("builds two placeholder welcome gift downloads", () => {
    const downloads = buildWelcomePackDownloads("hello@example.com");

    expect(downloads).toHaveLength(2);
    expect(downloads[0]?.content).toContain("hello@example.com");
    expect(downloads[1]?.content).toContain("hello@example.com");
  });
});
