import { describe, expect, test } from "vitest";

import {
  DM_BODY_MAX,
  DM_PREVIEW_MAX,
  evaluateCanMessage,
  isMinor,
  messageDenialCopy,
  messagePreview,
  minorBirthYearFloor,
  normaliseMessageBody,
  pairKey,
  type MessagingParty,
  type MessagingRelation,
} from "./messaging";

const now = new Date("2026-10-04T12:00:00Z");

function party(overrides: Partial<MessagingParty> = {}): MessagingParty {
  return {
    userId: "adult_a",
    inCommunity: true,
    isAdmin: false,
    isMinor: false,
    messagingBlocked: false,
    ...overrides,
  };
}

const noRelation: MessagingRelation = {
  blockedEitherWay: false,
  senderGuidesRecipient: false,
  recipientGuidesSender: false,
};

describe("pairKey", () => {
  test("is the same whichever side starts the conversation", () => {
    expect(pairKey("b", "a")).toBe("a:b");
    expect(pairKey("a", "b")).toBe(pairKey("b", "a"));
  });
});

describe("normaliseMessageBody", () => {
  test("trims and rejects empty or oversized messages", () => {
    expect(normaliseMessageBody("  hello ")).toEqual({ ok: true, body: "hello" });
    expect(normaliseMessageBody("   ").ok).toBe(false);
    expect(normaliseMessageBody(null).ok).toBe(false);
    expect(normaliseMessageBody("x".repeat(DM_BODY_MAX)).ok).toBe(true);
    expect(normaliseMessageBody("x".repeat(DM_BODY_MAX + 1)).ok).toBe(false);
  });
});

describe("messagePreview", () => {
  test("flattens whitespace and truncates long messages", () => {
    expect(messagePreview("Hi\n\nthere")).toBe("Hi there");
    const preview = messagePreview("x".repeat(DM_PREVIEW_MAX + 40));
    expect(preview).toHaveLength(DM_PREVIEW_MAX);
    expect(preview.endsWith("…")).toBe(true);
  });
});

describe("isMinor", () => {
  test("treats anyone who could still be 17 this year as under 18", () => {
    expect(minorBirthYearFloor(now)).toBe(2008);
    expect(isMinor(2008, now)).toBe(true);
    expect(isMinor(2016, now)).toBe(true);
    expect(isMinor(2007, now)).toBe(false);
  });

  test("a missing year of birth reads as an adult", () => {
    expect(isMinor(null, now)).toBe(false);
    expect(isMinor(undefined, now)).toBe(false);
  });
});

describe("evaluateCanMessage", () => {
  const adult = party();
  const otherAdult = party({ userId: "adult_b" });
  const minor = party({ userId: "minor_c", isMinor: true });
  const admin = party({ userId: "admin_d", isAdmin: true });

  test("adult members message each other freely", () => {
    expect(evaluateCanMessage(adult, otherAdult, noRelation)).toEqual({ ok: true });
  });

  test("basic refusals", () => {
    expect(evaluateCanMessage(adult, adult, noRelation)).toEqual({
      ok: false,
      reason: "self",
    });
    expect(
      evaluateCanMessage(party({ inCommunity: false }), otherAdult, noRelation),
    ).toEqual({ ok: false, reason: "sender_unavailable" });
    expect(
      evaluateCanMessage(party({ messagingBlocked: true }), otherAdult, noRelation),
    ).toEqual({ ok: false, reason: "sender_restricted" });
    expect(
      evaluateCanMessage(
        adult,
        party({ userId: "gone", inCommunity: false }),
        noRelation,
      ),
    ).toEqual({ ok: false, reason: "recipient_unavailable" });
  });

  test("a block in either direction stops messages", () => {
    expect(
      evaluateCanMessage(adult, otherAdult, {
        ...noRelation,
        blockedEitherWay: true,
      }),
    ).toEqual({ ok: false, reason: "blocked" });
  });

  test("an ordinary adult cannot message an under-18", () => {
    expect(evaluateCanMessage(adult, minor, noRelation)).toEqual({
      ok: false,
      reason: "safeguarding_recipient",
    });
  });

  test("an under-18 cannot message an ordinary member", () => {
    expect(evaluateCanMessage(minor, adult, noRelation)).toEqual({
      ok: false,
      reason: "safeguarding_sender",
    });
  });

  test("an under-18 and their leader or discipler can message both ways", () => {
    expect(
      evaluateCanMessage(adult, minor, {
        ...noRelation,
        senderGuidesRecipient: true,
      }),
    ).toEqual({ ok: true });
    expect(
      evaluateCanMessage(minor, adult, {
        ...noRelation,
        recipientGuidesSender: true,
      }),
    ).toEqual({ ok: true });
  });

  test("guiding the wrong way round does not unlock messaging", () => {
    expect(
      evaluateCanMessage(adult, minor, {
        ...noRelation,
        recipientGuidesSender: true,
      }),
    ).toEqual({ ok: false, reason: "safeguarding_recipient" });
  });

  test("admins and under-18s can message each other", () => {
    expect(evaluateCanMessage(admin, minor, noRelation)).toEqual({ ok: true });
    expect(evaluateCanMessage(minor, admin, noRelation)).toEqual({ ok: true });
  });

  test("two under-18s cannot message each other without a guide link", () => {
    const otherMinor = party({ userId: "minor_e", isMinor: true });
    expect(evaluateCanMessage(minor, otherMinor, noRelation).ok).toBe(false);
  });

  test("a block still applies to guides and admins", () => {
    expect(
      evaluateCanMessage(admin, minor, { ...noRelation, blockedEitherWay: true }),
    ).toEqual({ ok: false, reason: "blocked" });
  });
});

describe("messageDenialCopy", () => {
  test("never reveals a block or that someone is under 18", () => {
    const neutral = "You can't message this person.";
    expect(messageDenialCopy("blocked")).toBe(neutral);
    expect(messageDenialCopy("safeguarding_recipient")).toBe(neutral);
    expect(messageDenialCopy("recipient_unavailable")).toBe(neutral);
  });
});
