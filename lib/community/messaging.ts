/**
 * Private-message rules. Pure so the safeguarding logic is unit-tested and
 * shared by the server actions, the query layer and the UI.
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

const lagosYearFmt = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  timeZone: "Africa/Lagos",
});

/**
 * Enrolment stores only the year of birth, so anyone who could still be 17 at
 * some point this year counts as under 18: a birth year at or after this one.
 */
export function minorBirthYearFloor(now: Date = new Date()): number {
  return Number(lagosYearFmt.format(now)) - 18;
}

/** A missing year of birth reads as an adult. */
export function isMinor(
  birthYear: number | null | undefined,
  now: Date = new Date(),
): boolean {
  if (birthYear == null) return false;
  return birthYear >= minorBirthYearFloor(now);
}

export type MessagingParty = {
  userId: string;
  /** An enrolled learner or an admin. */
  inCommunity: boolean;
  isAdmin: boolean;
  isMinor: boolean;
  /** Admin restriction on sending private messages. */
  messagingBlocked: boolean;
};

export type MessagingRelation = {
  blockedEitherWay: boolean;
  /** The sender leads the recipient's unit or is their active discipler. */
  senderGuidesRecipient: boolean;
  /** The recipient leads the sender's unit or is their active discipler. */
  recipientGuidesSender: boolean;
};

export type MessageDenial =
  | "self"
  | "sender_unavailable"
  | "sender_restricted"
  | "recipient_unavailable"
  | "blocked"
  | "safeguarding_sender"
  | "safeguarding_recipient";

export type MessageDecision =
  | { ok: true }
  | { ok: false; reason: MessageDenial };

/**
 * Messaging is open between adult members. A conversation involving an
 * under-18 is allowed only with that learner's unit leader, their active
 * discipler, or an admin.
 */
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

  if (
    sender.isMinor &&
    !recipient.isAdmin &&
    !relation.recipientGuidesSender
  ) {
    return { ok: false, reason: "safeguarding_sender" };
  }
  if (
    recipient.isMinor &&
    !sender.isAdmin &&
    !relation.senderGuidesRecipient
  ) {
    return { ok: false, reason: "safeguarding_recipient" };
  }
  return { ok: true };
}

/** Learner-facing copy. Never says who blocked whom or that someone is under 18. */
export function messageDenialCopy(reason: MessageDenial): string {
  switch (reason) {
    case "self":
      return "You can't message yourself.";
    case "sender_unavailable":
      return "Enrol in SOGP to use messages.";
    case "sender_restricted":
      return "Messaging is paused on your account. Contact the Pleros team if you think this is a mistake.";
    case "safeguarding_sender":
      return "You can message your group leader, your discipler and the Pleros team.";
    case "recipient_unavailable":
    case "blocked":
    case "safeguarding_recipient":
      return "You can't message this person.";
  }
}
