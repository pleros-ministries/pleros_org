/**
 * An expected, learner-facing failure (validation, permissions, limits).
 * Server actions turn it into `{ ok: false, error }` because the message of a
 * thrown error is hidden from the browser in production.
 */
export class CommunityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommunityError";
  }
}

export type CommunityActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export const POSTING_PAUSED_COPY =
  "Posting is paused on your account. Contact the Pleros team if you think this is a mistake.";
