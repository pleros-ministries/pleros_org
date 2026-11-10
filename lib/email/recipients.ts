/**
 * Staff notification recipients: trimmed, lower-cased and deduplicated, in
 * first-seen order. Each person gets their own copy, so no address is shown
 * to anyone else.
 */
export function uniqueRecipients(emails: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const email of emails) {
    const normalised = email.trim().toLowerCase();
    if (normalised) seen.add(normalised);
  }
  return [...seen];
}

/** Resend accepts at most 100 emails in one batch request. */
export const RESEND_BATCH_MAX = 100;

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
