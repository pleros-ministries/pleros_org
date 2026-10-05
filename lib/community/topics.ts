/**
 * Discussion topics. Stored as a plain text key on `community_posts.topic` so
 * the list can change without an enum migration; unknown keys read as no topic.
 */
export const COMMUNITY_TOPICS = [
  { key: "question", label: "Question" },
  { key: "testimony", label: "Testimony" },
  { key: "prayer", label: "Prayer" },
  { key: "bible_study", label: "Bible study" },
  { key: "general", label: "General" },
] as const;

export type CommunityTopicKey = (typeof COMMUNITY_TOPICS)[number]["key"];

export function normaliseTopic(value: unknown): CommunityTopicKey | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return COMMUNITY_TOPICS.find((topic) => topic.key === key)?.key ?? null;
}

export function topicLabel(key: string | null | undefined): string | null {
  if (!key) return null;
  return COMMUNITY_TOPICS.find((topic) => topic.key === key)?.label ?? null;
}
