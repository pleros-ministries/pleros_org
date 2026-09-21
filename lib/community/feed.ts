import type { FeedPost } from "@/lib/db/queries/community-posts";

/** One page of the paginated community feed. */
export type FeedPage = { posts: FeedPost[]; nextOffset: number | null };

/**
 * Offset pagination over a feed whose `lastActivityAt` sort key is mutable can
 * briefly surface the same post on two pages; drop repeats by id.
 */
export function dedupeFeed(posts: FeedPost[]): FeedPost[] {
  const seen = new Set<number>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}
