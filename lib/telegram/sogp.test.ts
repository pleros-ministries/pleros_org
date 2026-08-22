import { describe, expect, test } from "vitest";

import {
  createSogpTelegramLink,
  parseSogpTelegramStart,
} from "./sogp";

describe("SOGP Telegram links", () => {
  test("creates a URL-safe start parameter within Telegram limits", () => {
    const result = createSogpTelegramLink({
      enrollmentId: 42,
      botUsername: "PlerosSogpBot",
      secret: "test-secret",
    });

    expect(result.url).toMatch(
      /^https:\/\/t\.me\/PlerosSogpBot\?start=[A-Za-z0-9_-]+$/,
    );
    expect(result.startParameter.length).toBeLessThanOrEqual(64);
    expect(result.tokenHash).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("parses a private /start update", () => {
    expect(
      parseSogpTelegramStart({
        message: {
          text: "/start abc_123",
          chat: { id: 123, type: "private" },
          from: { id: 456 },
        },
      }),
    ).toEqual({ token: "abc_123", telegramUserId: "456", chatId: "123" });
  });

  test("ignores group and non-start updates", () => {
    expect(
      parseSogpTelegramStart({
        message: {
          text: "/start abc",
          chat: { id: -10, type: "supergroup" },
          from: { id: 456 },
        },
      }),
    ).toBeNull();
  });
});
