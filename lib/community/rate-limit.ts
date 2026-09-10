import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/** Per-user creation limits within a rolling window. */
export const COMMUNITY_LIMITS = {
  post: { max: 10, windowMinutes: 60 },
  comment: { max: 40, windowMinutes: 60 },
  /** New enrolments wait this long before they can post at all. */
  newAccountCooldownMinutes: 10,
} as const;

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

function windowStart(minutes: number) {
  return new Date(Date.now() - minutes * 60_000);
}

export async function assertCanCreatePost(userId: string) {
  const since = windowStart(COMMUNITY_LIMITS.post.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.communityPosts)
    .where(
      and(
        eq(schema.communityPosts.authorId, userId),
        gte(schema.communityPosts.createdAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.post.max) {
    throw new RateLimitError(
      "You've posted several times recently. Try again a little later.",
    );
  }
}

export async function assertCanComment(userId: string) {
  const since = windowStart(COMMUNITY_LIMITS.comment.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.communityPostComments)
    .where(
      and(
        eq(schema.communityPostComments.authorId, userId),
        gte(schema.communityPostComments.createdAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.comment.max) {
    throw new RateLimitError(
      "You're posting very quickly. Take a short break and try again.",
    );
  }
}
