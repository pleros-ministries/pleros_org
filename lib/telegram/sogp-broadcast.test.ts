import { describe, expect, test } from "vitest";

import {
  normalizeSogpBroadcast,
  sendSogpChannelMessage,
} from "./sogp-broadcast";

describe("SOGP Telegram broadcasts", () => {
  test("normalizes a supported message", () => {
    expect(
      normalizeSogpBroadcast({ kind: "general", message: "  Welcome!  " }),
    ).toEqual({ kind: "general", message: "Welcome!" });
  });

  test("rejects empty and overlong messages", () => {
    expect(() =>
      normalizeSogpBroadcast({ kind: "general", message: " " }),
    ).toThrow("Message is required.");
    expect(() =>
      normalizeSogpBroadcast({ kind: "general", message: "x".repeat(4_097) }),
    ).toThrow("Telegram messages cannot exceed 4,096 characters.");
  });

  test("posts to configured channel without learner data", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init });
      return Response.json({ ok: true, result: { message_id: 99 } });
    };

    const result = await sendSogpChannelMessage(
      { kind: "track_release", message: "Day 1 is available." },
      {
        botToken: "bot-token",
        channelId: "-1001",
        fetcher,
      },
    );

    expect(result).toEqual({ messageId: 99 });
    expect(requests).toHaveLength(1);
    expect(JSON.parse(String(requests[0]?.init?.body))).toMatchObject({
      chat_id: "-1001",
      text: "Day 1 is available.",
    });
  });
});
