import { describe, expect, test } from "vitest";

import {
  formatSogpSignupAlert,
  sendSogpSignupAlert,
  type SogpSignupAlertInput,
} from "./sogp-signup-alert";

const baseInput: SogpSignupAlertInput = {
  enrollmentId: 42,
  firstName: "Jane",
  lastName: "Doe",
  phone: "+2348012345678",
  country: "Nigeria",
  region: "Lagos",
  birthYear: 1998,
  referralSource: "Instagram",
  cohortTitle: "SOGP — September 2026",
};

describe("formatSogpSignupAlert", () => {
  test("lays out every field and derives age from birth year", () => {
    const text = formatSogpSignupAlert(baseInput, new Date("2026-09-02T00:00:00Z"));

    expect(text).toBe(
      [
        "🎓 New SOGP enrolment #42",
        "",
        "Name: Jane Doe",
        "Phone: +2348012345678",
        "Country: Nigeria",
        "State: Lagos",
        "Age: 28",
        "Heard about us: Instagram",
        "Cohort: SOGP — September 2026",
      ].join("\n"),
    );
  });

  test("omits the age line when birth year is missing", () => {
    const text = formatSogpSignupAlert(
      { ...baseInput, birthYear: null },
      new Date("2026-09-02T00:00:00Z"),
    );

    expect(text).not.toContain("Age:");
  });

  test("falls back to an em dash for empty region and referral", () => {
    const text = formatSogpSignupAlert(
      { ...baseInput, region: "", referralSource: "" },
      new Date("2026-09-02T00:00:00Z"),
    );

    expect(text).toContain("State: —");
    expect(text).toContain("Heard about us: —");
  });
});

describe("sendSogpSignupAlert", () => {
  test("returns null when the bot token or chat id is absent", async () => {
    expect(
      await sendSogpSignupAlert(baseInput, { chatId: "-100", botToken: "" }),
    ).toBeNull();
    expect(
      await sendSogpSignupAlert(baseInput, { botToken: "bot", chatId: "" }),
    ).toBeNull();
  });

  test("posts the formatted alert to the configured chat", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      requests.push({ url: String(url), init });
      return Response.json({ ok: true, result: { message_id: 42 } });
    };

    const result = await sendSogpSignupAlert(baseInput, {
      botToken: "bot-token",
      chatId: "-1004488908648",
      fetcher,
    });

    expect(result).toEqual({ messageId: 42 });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe(
      "https://api.telegram.org/botbot-token/sendMessage",
    );
    const body = JSON.parse(String(requests[0]?.init?.body));
    expect(body).toMatchObject({ chat_id: "-1004488908648" });
    expect(body.text).toContain("Name: Jane Doe");
    expect(body.text).toContain("Phone: +2348012345678");
  });

  test("throws with the Telegram description on a failed response", async () => {
    const fetcher: typeof fetch = async () =>
      Response.json({ ok: false, description: "chat not found" }, { status: 400 });

    await expect(
      sendSogpSignupAlert(baseInput, {
        botToken: "bot-token",
        chatId: "-100",
        fetcher,
      }),
    ).rejects.toThrow("chat not found");
  });
});
