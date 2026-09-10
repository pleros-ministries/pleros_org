/** Query-key registry for the community/forum client tree (TanStack Query). */
export const communityKeys = {
  all: ["community"] as const,
  feed: () => [...communityKeys.all, "feed"] as const,
  comments: (postId: number) =>
    [...communityKeys.all, "comments", postId] as const,
  notifications: () => [...communityKeys.all, "notifications"] as const,
};
