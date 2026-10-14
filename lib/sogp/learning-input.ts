import { CommunityError } from "@/lib/community/errors";
export type SogpLearningPath = "traditional" | "podcast_one" | "podcast_two";

export function learningRequest(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommunityError("Check your learning settings.");
  return value as Record<string, unknown>;
}
export function learningRevision(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= 2147483647) throw new CommunityError("Reload your learning plan before saving.");
  return value;
}
export function learningPath(value: unknown): SogpLearningPath {
  if (value !== "traditional" && value !== "podcast_one" && value !== "podcast_two") throw new CommunityError("Choose Traditional, one podcast or two podcasts per day.");
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
