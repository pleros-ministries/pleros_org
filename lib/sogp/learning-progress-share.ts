export const MAX_LEARNING_PROGRESS_WORDS = 20;
export const MAX_LEARNING_PROGRESS_CHARS = 120;
export const MAX_LEARNING_PROGRESS_VIDEO_SECONDS = 60;

// Brand constants shared by the server-rendered share card
// (app/api/sogp/learning-progress-shares/[id]/image/route.tsx) and the
// client-side video overlay (lib/sogp/learning-progress-video-overlay.ts) —
// kept here, rather than in the (server-only) image route, so client code
// can import them without pulling in that route's node:fs usage.
export const LEARNING_PROGRESS_SHARE_PADDING = 64;
export const LEARNING_PROGRESS_SHARE_NAVY = "#0A1A6E";
export const LEARNING_PROGRESS_SHARE_SKY = "#DBF0FC";
export const LEARNING_PROGRESS_SHARE_PATTERN_BLUE = "#133FD4";
export const LEARNING_PROGRESS_SHARE_ACCENT_LIGHT = "#7BA253";
export const LEARNING_PROGRESS_SHARE_ACCENT_DARK = "#A8C98A";
export const LEARNING_PROGRESS_SHARE_WHAT_I_LEARNT_GREEN = "#4E6E33";
export const LEARNING_PROGRESS_SHARE_SANS = "Poppins";
export const LEARNING_PROGRESS_SHARE_SERIF = "Newsreader";

export type LearningProgressRenderContext = {
  track: "sogp" | "pre_sogp";
  dayNumber: number | null;
  lessonTitle: string | null;
};

export function getLearningProgressDayText(
  context: LearningProgressRenderContext,
): string {
  return context.dayNumber
    ? `Day ${context.dayNumber}`
    : context.track === "pre_sogp"
      ? "Pre-SOGP"
      : "SOGP";
}

export function getLearningProgressTeachingLabel(
  context: LearningProgressRenderContext,
): string {
  return context.lessonTitle
    ? "Teaching"
    : context.track === "pre_sogp"
      ? "Pre-SOGP preparation"
      : "Learning progress";
}

export function getLearningProgressHeadline(
  context: LearningProgressRenderContext,
): string {
  if (context.lessonTitle) return context.lessonTitle;
  return context.track === "pre_sogp"
    ? "My Pre-SOGP Journey"
    : "My SOGP Learning Progress";
}

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

export function buildLearningProgressVideoShareMessage(): string {
  return [
    "Watch my SOGP learning progress.",
    "SOGP is a free journey to discover God's purpose.",
    "You can join the next cohort free here:",
  ].join(" ");
}
