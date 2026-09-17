export const MAX_LEARNING_PROGRESS_WORDS = 100;
const MAX_LEARNING_PROGRESS_CHARS = 700;

export function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function validateLearningProgressQuote(
  input: string | null | undefined,
): { error: string; quote: null } | { error: null; quote: string } {
  const quote = input?.trim() || "";
  if (!quote) {
    return { error: "Write a few words about your progress.", quote: null };
  }
  if (quote.length > MAX_LEARNING_PROGRESS_CHARS) {
    return {
      error: `Keep your reflection under ${MAX_LEARNING_PROGRESS_CHARS} characters.`,
      quote: null,
    };
  }
  if (countWords(quote) > MAX_LEARNING_PROGRESS_WORDS) {
    return {
      error: `Keep your reflection to ${MAX_LEARNING_PROGRESS_WORDS} words or fewer.`,
      quote: null,
    };
  }
  return { error: null, quote };
}

export function buildLearningProgressShareMessage(input: {
  quote: string;
}): string {
  return [
    `"${input.quote}"`,
    "That's my SOGP learning progress. SOGP is a free journey to discover God's purpose.",
    "You can join the next cohort free here:",
  ].join(" ");
}
