import { CommunityError } from "@/lib/community/errors";
export type SogpLearningPath = "traditional" | "podcast_one" | "podcast_two" | "doctrinal";

/**
 * The Personalised path (named "Choose doctrinal journey" until 24 November;
 * the stored value stays "doctrinal", and "traditional" is the Doctrinal path):
 * Library teachings,
 * one a day, kept in the same plan, listen and playback tables as podcast
 * episodes under "teaching:<id>" keys (migration 0079).
 */
export const TEACHING_KEY_PREFIX = "teaching:";
export const isTeachingKey = (guid: string) => guid.startsWith(TEACHING_KEY_PREFIX);
export const teachingKey = (id: number) => `${TEACHING_KEY_PREFIX}${id}`;
/** Paths that follow a saved plan of items rather than the cohort's tracks. */
export const isPlanPath = (path: SogpLearningPath | null | undefined): path is "podcast_one" | "podcast_two" | "doctrinal" => path === "podcast_one" || path === "podcast_two" || path === "doctrinal";
/** Items per day on each plan path. */
export const planPace = (path: "podcast_one" | "podcast_two" | "doctrinal"): 1 | 2 => path === "podcast_two" ? 2 : 1;

export function learningRequest(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommunityError("Check your learning settings.");
  return value as Record<string, unknown>;
}
export function learningRevision(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= 2147483647) throw new CommunityError("Reload your learning plan before saving.");
  return value;
}
export function learningPath(value: unknown): SogpLearningPath {
  if (value !== "traditional" && value !== "podcast_one" && value !== "podcast_two" && value !== "doctrinal") throw new CommunityError("Choose the doctrinal path, a podcast pace or a personalised path.");
  return value;
}
export function learningGuid(value: unknown) {
  if (typeof value !== "string" || !value || value.trim() !== value) throw new CommunityError("Choose a valid episode.");
  return value;
}
export function learningPosition(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new CommunityError("Choose a valid playback position.");
  return value;
}
