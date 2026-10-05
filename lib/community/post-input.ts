import { normaliseTopic, type CommunityTopicKey } from "./topics";

/** Validation for member-written posts. Pure so the rules are unit-tested. */

export const POST_TITLE_MAX = 140;
export const POST_BODY_MAX = 5000;

export type PostKind = "official" | "discussion";

export type NormalisedPostInput = {
  kind: PostKind;
  title: string | null;
  body: string;
  topic: CommunityTopicKey | null;
};

export type PostInputResult =
  | { ok: true; value: NormalisedPostInput }
  | { ok: false; error: string };

/**
 * A discussion needs a title (the body is optional); an announcement needs a
 * body or a photo. Topics only apply to discussions.
 */
export function normalisePostInput(input: {
  kind: PostKind;
  title?: string | null;
  body?: string | null;
  topic?: string | null;
  hasImages?: boolean;
}): PostInputResult {
  const title = (input.title ?? "").replace(/\s+/g, " ").trim();
  const body = (input.body ?? "").trim();

  if (title.length > POST_TITLE_MAX) {
    return {
      ok: false,
      error: `Keep the title under ${POST_TITLE_MAX} characters.`,
    };
  }
  if (body.length > POST_BODY_MAX) {
    return {
      ok: false,
      error: `Keep the post under ${POST_BODY_MAX.toLocaleString("en-GB")} characters.`,
    };
  }

  if (input.kind === "discussion") {
    if (!title) {
      return { ok: false, error: "Give your discussion a title." };
    }
    return {
      ok: true,
      value: { kind: "discussion", title, body, topic: normaliseTopic(input.topic) },
    };
  }

  if (!body && !input.hasImages) {
    return { ok: false, error: "Write something or add a photo." };
  }
  return {
    ok: true,
    value: { kind: "official", title: title || null, body, topic: null },
  };
}

/** True while a new enrolment is still inside its first-post waiting period. */
export function isWithinNewAccountCooldown(
  enrolledAt: Date | null,
  cooldownMinutes: number,
  now: Date = new Date(),
): boolean {
  if (!enrolledAt) return false;
  return now.getTime() - enrolledAt.getTime() < cooldownMinutes * 60_000;
}
