/**
 * Rules for Ask Pleros: private questions from a learner to the ministry,
 * optionally anonymous. Pure so the anonymity rule is unit-tested.
 *
 * The one promise: when a question is anonymous, nothing staff can see or
 * receive identifies the asker. `staffAskerView` is the only place the
 * staff-facing identity is produced.
 */

export const QUESTION_BODY_MAX = 2000;
export const STAFF_REPLY_MAX = 5000;

export const ASK_PLEROS_LIMITS = {
  /** New questions per person. */
  question: { max: 5, windowMinutes: 60 * 24 },
  /** Messages from the asker across their conversations. */
  followUp: { max: 20, windowMinutes: 60 },
} as const;

export type QuestionStatus = "open" | "answered" | "closed";

export const ASK_PLEROS_MUTED_COPY =
  "You can't send questions here at the moment. If you need help, please reach the Pleros team another way.";

export function normaliseQuestionBody(
  value: unknown,
  max: number = QUESTION_BODY_MAX,
): { ok: true; body: string } | { ok: false; error: string } {
  const body = typeof value === "string" ? value.trim() : "";
  if (!body) return { ok: false, error: "Write your question first." };
  if (body.length > max) {
    return {
      ok: false,
      error: `Keep it under ${max.toLocaleString("en-GB")} characters.`,
    };
  }
  return { ok: true, body };
}

/**
 * The asker must choose each time; nothing is preselected. Returns null when
 * no valid choice was made.
 */
export function parseAnonymityChoice(value: unknown): boolean | null {
  if (value === "anonymous") return true;
  if (value === "named") return false;
  return null;
}

/** Everything staff may know about who asked. */
export type StaffAskerView =
  | { anonymous: true }
  | { anonymous: false; name: string; groupName: string | null };

/**
 * Reduces an asker to what staff may see. An anonymous asker carries nothing
 * at all, whatever the caller passes in.
 */
export function staffAskerView(input: {
  isAnonymous: boolean;
  name: string | null;
  groupName: string | null;
}): StaffAskerView {
  if (input.isAnonymous) return { anonymous: true };
  return {
    anonymous: false,
    name: input.name?.trim() || "A community member",
    groupName: input.groupName?.trim() || null,
  };
}

export function staffAskerLabel(view: StaffAskerView): string {
  return view.anonymous ? "Anonymous" : view.name;
}

/** The shared inbox for new questions: its own address, else the contact-form inbox. */
export function resolveAskPlerosInbox(
  env: Record<string, string | undefined>,
): string | null {
  return (
    env.ASK_PLEROS_INBOX_EMAIL?.trim() ||
    env.CONTACT_INBOX_EMAIL?.trim() ||
    null
  );
}
