import { describe, expect, test } from "vitest";

import {
  QUESTION_BODY_MAX,
  STAFF_REPLY_MAX,
  normaliseQuestionBody,
  parseAnonymityChoice,
  resolveAskPlerosInbox,
  staffAskerLabel,
  staffAskerView,
} from "./ask-pleros";

describe("staffAskerView", () => {
  test("an anonymous asker carries nothing that identifies them", () => {
    const view = staffAskerView({
      isAnonymous: true,
      name: "Ada Grace Nwosu",
      groupName: "Lagos, Nigeria",
    });

    expect(view).toEqual({ anonymous: true });
    expect(Object.keys(view)).toEqual(["anonymous"]);
    expect(JSON.stringify(view)).not.toContain("Ada");
    expect(JSON.stringify(view)).not.toContain("Lagos");
    expect(staffAskerLabel(view)).toBe("Anonymous");
  });

  test("a named asker shows their name and group", () => {
    const view = staffAskerView({
      isAnonymous: false,
      name: " Ada Grace Nwosu ",
      groupName: "Lagos, Nigeria",
    });

    expect(view).toEqual({
      anonymous: false,
      name: "Ada Grace Nwosu",
      groupName: "Lagos, Nigeria",
    });
    expect(staffAskerLabel(view)).toBe("Ada Grace Nwosu");
  });

  test("a named asker without a stored name still reads sensibly", () => {
    expect(
      staffAskerView({ isAnonymous: false, name: null, groupName: null }),
    ).toEqual({ anonymous: false, name: "A community member", groupName: null });
  });
});

describe("parseAnonymityChoice", () => {
  test("only an explicit choice counts", () => {
    expect(parseAnonymityChoice("anonymous")).toBe(true);
    expect(parseAnonymityChoice("named")).toBe(false);
    expect(parseAnonymityChoice("")).toBeNull();
    expect(parseAnonymityChoice(undefined)).toBeNull();
    expect(parseAnonymityChoice(true)).toBeNull();
  });
});

describe("normaliseQuestionBody", () => {
  test("trims and rejects empty or oversized text", () => {
    expect(normaliseQuestionBody("  How do I pray?  ")).toEqual({
      ok: true,
      body: "How do I pray?",
    });
    expect(normaliseQuestionBody("   ").ok).toBe(false);
    expect(normaliseQuestionBody(null).ok).toBe(false);
    expect(normaliseQuestionBody("x".repeat(QUESTION_BODY_MAX)).ok).toBe(true);
    expect(normaliseQuestionBody("x".repeat(QUESTION_BODY_MAX + 1)).ok).toBe(
      false,
    );
  });

  test("staff replies have their own, longer limit", () => {
    const long = "x".repeat(QUESTION_BODY_MAX + 1);
    expect(normaliseQuestionBody(long, STAFF_REPLY_MAX).ok).toBe(true);
    expect(
      normaliseQuestionBody("x".repeat(STAFF_REPLY_MAX + 1), STAFF_REPLY_MAX).ok,
    ).toBe(false);
  });
});

describe("resolveAskPlerosInbox", () => {
  test("prefers its own inbox, then the contact inbox", () => {
    expect(
      resolveAskPlerosInbox({
        ASK_PLEROS_INBOX_EMAIL: " ask@pleros.org ",
        CONTACT_INBOX_EMAIL: "team@pleros.org",
      }),
    ).toBe("ask@pleros.org");
    expect(resolveAskPlerosInbox({ CONTACT_INBOX_EMAIL: "team@pleros.org" })).toBe(
      "team@pleros.org",
    );
  });

  test("is null when neither is set", () => {
    expect(resolveAskPlerosInbox({})).toBeNull();
    expect(resolveAskPlerosInbox({ ASK_PLEROS_INBOX_EMAIL: "  " })).toBeNull();
  });
});
