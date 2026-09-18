export const MAX_LEARNING_PROGRESS_WORDS = 100;
const MAX_LEARNING_PROGRESS_CHARS = 700;

export const LEARNING_PROGRESS_SHARE_TEMPLATES = [
  {
    id: "light-card",
    label: "Daylight",
    background: "#d2f1ff",
    foreground: "#051480",
  },
  {
    id: "dark-open",
    label: "Midnight",
    background: "#051480",
    foreground: "#ffffff",
  },
  {
    id: "dark-card",
    label: "Midnight card",
    background: "#051480",
    foreground: "#ffffff",
  },
] as const;

export type LearningProgressShareTemplate =
  (typeof LEARNING_PROGRESS_SHARE_TEMPLATES)[number]["id"];

export const DEFAULT_LEARNING_PROGRESS_SHARE_TEMPLATE: LearningProgressShareTemplate =
  "light-card";

export function isLearningProgressShareTemplate(
  value: unknown,
): value is LearningProgressShareTemplate {
  return LEARNING_PROGRESS_SHARE_TEMPLATES.some(
    (template) => template.id === value,
  );
}

export function getLearningProgressShareInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return (first + last).toUpperCase();
}

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
