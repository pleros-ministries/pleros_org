import { describe, expect, test } from "vitest";

import {
  DM_BODY_MAX,
  DM_PREVIEW_MAX,
  evaluateCanMessage,
  messageDenialCopy,
  messagePreview,
  normaliseMessageBody,
  pairKey,
  type MessagingParty,
  type MessagingRelation,
} from "./messaging";

function party(overrides: Partial<MessagingParty> = {}): MessagingParty {
  return {
    userId: "member_a",
    inCommunity: true,
    messagingBlocked: false,
    ...overrides,
  };
}

const noRelation: MessagingRelation = { blockedEitherWay: false };

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

describe("evaluateCanMessage", () => {
  const member = party();
  const otherMember = party({ userId: "member_b" });

  test("members message each other freely, whatever their age", () => {
    expect(evaluateCanMessage(member, otherMember, noRelation)).toEqual({ ok: true });
  });

  test("basic refusals", () => {
    expect(evaluateCanMessage(member, member, noRelation)).toEqual({
      ok: false,
      reason: "self",
    });
    expect(
      evaluateCanMessage(party({ inCommunity: false }), otherMember, noRelation),
    ).toEqual({ ok: false, reason: "sender_unavailable" });
    expect(
      evaluateCanMessage(party({ messagingBlocked: true }), otherMember, noRelation),
    ).toEqual({ ok: false, reason: "sender_restricted" });
    expect(
      evaluateCanMessage(
        member,
        party({ userId: "gone", inCommunity: false }),
        noRelation,
      ),
    ).toEqual({ ok: false, reason: "recipient_unavailable" });
  });

  test("a block in either direction stops messages", () => {
    expect(
      evaluateCanMessage(member, otherMember, { blockedEitherWay: true }),
    ).toEqual({ ok: false, reason: "blocked" });
  });
});

describe("messageDenialCopy", () => {
  test("never reveals a block", () => {
    const neutral = "You can't message this person.";
    expect(messageDenialCopy("blocked")).toBe(neutral);
    expect(messageDenialCopy("recipient_unavailable")).toBe(neutral);
  });
});
