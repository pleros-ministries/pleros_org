import type { FeedView } from "./feed-view";

/** Query-key registry for the community/forum client tree (TanStack Query). */
export const communityKeys = {
  all: ["community"] as const,
  /** Prefix of every feed query — use it to invalidate or patch all open views. */
  feedRoot: () => [...communityKeys.all, "feed"] as const,
  /** `source` names the feed: "community", "unit:8" or "discipleship:3". */
  feed: (source: string, view: FeedView) =>
    [...communityKeys.all, "feed", source, view.sort, view.filter] as const,
  comments: (postId: number) =>
    [...communityKeys.all, "comments", postId] as const,
  notifications: () => [...communityKeys.all, "notifications"] as const,
  conversations: () => [...communityKeys.all, "conversations"] as const,
  unreadMessages: () => [...communityKeys.all, "unread-messages"] as const,
  question: (questionId: number) =>
    [...communityKeys.all, "question", questionId] as const,
  unreadQuestions: () => [...communityKeys.all, "unread-questions"] as const,
  messages: (conversationId: number) =>
    [...communityKeys.all, "messages", conversationId] as const,
  memberSearch: (query: string) =>
    [...communityKeys.all, "member-search", query] as const,
};
