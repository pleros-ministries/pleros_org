/**
 * Private-message rules. Pure so the logic is unit-tested and shared by the
 * server actions, the query layer and the UI.
 */

export const DM_BODY_MAX = 2000;
export const DM_PREVIEW_MAX = 80;
/** Messages loaded per page of a conversation's history. */
export const DM_PAGE_SIZE = 50;

/** One conversation per pair, whichever side starts it. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

export function normaliseMessageBody(
  value: unknown,
): { ok: true; body: string } | { ok: false; error: string } {
  const body = typeof value === "string" ? value.trim() : "";
  if (!body) return { ok: false, error: "Write a message first." };
  if (body.length > DM_BODY_MAX) {
    return {
      ok: false,
      error: `Keep messages under ${DM_BODY_MAX.toLocaleString("en-GB")} characters.`,
    };
  }
  return { ok: true, body };
}

export function messagePreview(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > DM_PREVIEW_MAX
    ? `${flat.slice(0, DM_PREVIEW_MAX - 1)}…`
    : flat;
}

export type MessagingParty = {
  userId: string;
  /** An enrolled learner or an admin. */
  inCommunity: boolean;
  /** Admin restriction on sending private messages. */
  messagingBlocked: boolean;
};

export type MessagingRelation = {
  blockedEitherWay: boolean;
};

export type MessageDenial =
  | "self"
  | "sender_unavailable"
  | "sender_restricted"
  | "recipient_unavailable"
  | "blocked";

export type MessageDecision =
  | { ok: true }
  | { ok: false; reason: MessageDenial };

/** Messaging is open between members, except where someone has blocked. */
export function evaluateCanMessage(
  sender: MessagingParty,
  recipient: MessagingParty,
  relation: MessagingRelation,
): MessageDecision {
  if (sender.userId === recipient.userId) return { ok: false, reason: "self" };
  if (!sender.inCommunity) return { ok: false, reason: "sender_unavailable" };
  if (sender.messagingBlocked) {
    return { ok: false, reason: "sender_restricted" };
  }
  if (!recipient.inCommunity) {
    return { ok: false, reason: "recipient_unavailable" };
  }
  if (relation.blockedEitherWay) return { ok: false, reason: "blocked" };
  return { ok: true };
}

/** Learner-facing copy. Never says who blocked whom. */
export function messageDenialCopy(reason: MessageDenial): string {
  switch (reason) {
    case "self":
      return "You can't message yourself.";
    case "sender_unavailable":
      return "Enrol in SOGP to use messages.";
    case "sender_restricted":
      return "Messaging is paused on your account. Contact the Pleros team if you think this is a mistake.";
    case "recipient_unavailable":
    case "blocked":
      return "You can't message this person.";
  }
}
