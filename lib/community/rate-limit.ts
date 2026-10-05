import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { isWithinNewAccountCooldown } from "@/lib/community/post-input";

/** Per-user creation limits within a rolling window. */
export const COMMUNITY_LIMITS = {
  post: { max: 10, windowMinutes: 60 },
  comment: { max: 40, windowMinutes: 60 },
  /** Discipleship check-in questions, per group. */
  discipleshipPrompt: { max: 5, windowMinutes: 60 * 24 },
  /** New enrolments wait this long before they can post at all. */
  newAccountCooldownMinutes: 10,
  /** Private messages, per sender. */
  directMessage: { max: 60, windowMinutes: 60 },
  /** Conversations a sender may open with new people — deters spam. */
  newConversation: { max: 10, windowMinutes: 60 * 24 },
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

/** New learners wait briefly before their first post; leaders and admins do not. */
export function assertPastNewAccountCooldown(ctx: {
  isAdmin: boolean;
  isUnitLeader: boolean;
  enrolledAt: Date | null;
}) {
  if (ctx.isAdmin || ctx.isUnitLeader) return;
  if (
    isWithinNewAccountCooldown(
      ctx.enrolledAt,
      COMMUNITY_LIMITS.newAccountCooldownMinutes,
    )
  ) {
    throw new RateLimitError(
      "Welcome! You can start posting a few minutes after enrolling. Try again shortly.",
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

export async function assertCanCreateDiscipleshipPrompt(groupId: number) {
  const since = windowStart(COMMUNITY_LIMITS.discipleshipPrompt.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.discipleshipPrompts)
    .where(
      and(
        eq(schema.discipleshipPrompts.groupId, groupId),
        gte(schema.discipleshipPrompts.createdAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.discipleshipPrompt.max) {
    throw new RateLimitError(
      "You've sent several check-ins today. Give your group time to answer, then try again tomorrow.",
    );
  }
}

export async function assertCanSendMessage(userId: string) {
  const since = windowStart(COMMUNITY_LIMITS.directMessage.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.dmMessages)
    .where(
      and(
        eq(schema.dmMessages.senderId, userId),
        gte(schema.dmMessages.createdAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.directMessage.max) {
    throw new RateLimitError(
      "You're sending messages very quickly. Take a short break and try again.",
    );
  }
}

export async function assertCanStartConversation(userId: string) {
  const since = windowStart(COMMUNITY_LIMITS.newConversation.windowMinutes);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.dmConversations)
    .where(
      and(
        eq(schema.dmConversations.startedBy, userId),
        gte(schema.dmConversations.startedAt, since),
      ),
    );
  if (n >= COMMUNITY_LIMITS.newConversation.max) {
    throw new RateLimitError(
      "You've started several new conversations today. Try again tomorrow.",
    );
  }
}
