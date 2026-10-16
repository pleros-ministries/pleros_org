import { describe, expect, test } from "vitest";

import { reminderPromptState } from "@/components/dashboard/prayer-reminder-prompt";

describe("reminderPromptState", () => {
  test("a subscribed device renders nothing", () => {
    expect(
      reminderPromptState({ isSupported: true, isSubscribed: true, permission: "granted" }),
    ).toBe("ready");
  });

  test("an unsupported browser gets install guidance", () => {
    expect(
      reminderPromptState({ isSupported: false, isSubscribed: false, permission: "unsupported" }),
    ).toBe("unsupported");
  });

  test("a denied permission gets settings guidance", () => {
    expect(
      reminderPromptState({ isSupported: true, isSubscribed: false, permission: "denied" }),
    ).toBe("blocked");
  });

  test("a supported undecided device gets the subscribe button", () => {
    expect(
      reminderPromptState({ isSupported: true, isSubscribed: false, permission: "default" }),
    ).toBe("subscribe");
  });
});
