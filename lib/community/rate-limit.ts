import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/** Per-user creation limits within a rolling window. */
export const COMMUNITY_LIMITS = {
  thread: { max: 5, windowMinutes: 60 },
  message: { max: 30, windowMinutes: 60 },
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

export async function assertCanCreateThread(userId: string) {
  const since = windowStart(COMMUNITY_LIMITS.thread.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.communityThreads)
    .where(
      and(
        eq(schema.communityThreads.authorId, userId),
        gte(schema.communityThreads.createdAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.thread.max) {
    throw new RateLimitError(
      "You've started several discussions recently. Try again a little later.",
    );
  }
}

export async function assertCanPostMessage(userId: string) {
  const since = windowStart(COMMUNITY_LIMITS.message.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.communityMessages)
    .where(
      and(
        eq(schema.communityMessages.authorId, userId),
        gte(schema.communityMessages.createdAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.message.max) {
    throw new RateLimitError(
      "You're posting very quickly. Take a short break and try again.",
    );
  }
}
