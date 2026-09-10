import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
import { assertCanComment } from "@/lib/community/rate-limit";
import { canModeratePostRow, getPostMeta } from "@/lib/db/queries/community-posts";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

export type PostComment = {
  id: number;
  body: string | null;
  authorName: string;
  authorId: string;
  isMine: boolean;
  replyToId: number | null;
  createdAt: string;
  status: "visible" | "hidden" | "removed";
  reactionCount: number;
  reactedByMe: boolean;
  canModerate: boolean;
};

/** Visible + hidden (tombstoned) comments for a post, oldest first. */
export async function listComments(
  ctx: CommunityContext,
  postId: number,
): Promise<PostComment[]> {
  const postMeta = await getPostMeta(postId);
  const canModerate = postMeta ? canModeratePostRow(ctx, postMeta) : false;

  const rows = await db
    .select({
      comment: schema.communityPostComments,
      authorName: schema.users.name,
      reactionCount: sql<number>`(
        select count(*) from ${schema.commentReactions}
        where ${schema.commentReactions.commentId} = ${schema.communityPostComments.id}
      )::int`,
      reactedByMe: sql<boolean>`exists (
        select 1 from ${schema.commentReactions}
        where ${schema.commentReactions.commentId} = ${schema.communityPostComments.id}
          and ${schema.commentReactions.userId} = ${ctx.userId}
      )`,
    })
    .from(schema.communityPostComments)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.communityPostComments.authorId),
    )
    .where(
      and(
        eq(schema.communityPostComments.postId, postId),
        sql`${schema.communityPostComments.status} <> 'removed'`,
      ),
    )
    .orderBy(asc(schema.communityPostComments.createdAt));

  return rows.map((row) => ({
    id: row.comment.id,
    body: row.comment.status === "hidden" ? null : row.comment.body,
    authorName: firstName(row.authorName),
    authorId: row.comment.authorId,
    isMine: row.comment.authorId === ctx.userId,
    replyToId: row.comment.replyToId,
    createdAt: row.comment.createdAt.toISOString(),
    status: row.comment.status,
    reactionCount: row.reactionCount,
    reactedByMe: row.reactedByMe,
    canModerate,
  }));
}

export async function addComment(
  ctx: CommunityContext,
  input: { postId: number; body: string; replyToId?: number | null },
): Promise<{ id: number; postAuthorId: string; replyToAuthorId: string | null }> {
  await assertCanComment(ctx.userId);
  const body = input.body.trim();
  if (!body) throw new Error("Comment cannot be empty.");

  const post = await getPostMeta(input.postId);
  if (!post || post.status !== "published") {
    throw new Error("This post is no longer available.");
  }
  if (
    post.scope === "unit" &&
    !ctx.isAdmin &&
    post.unitId !== ctx.unit?.id
  ) {
    throw new Error("Forbidden");
  }

  // One level of nesting: only allow replying to a top-level comment on this post.
  let replyToId: number | null = null;
  let replyToAuthorId: string | null = null;
  if (input.replyToId) {
    const [parent] = await db
      .select({
        postId: schema.communityPostComments.postId,
        replyToId: schema.communityPostComments.replyToId,
        authorId: schema.communityPostComments.authorId,
      })
      .from(schema.communityPostComments)
      .where(eq(schema.communityPostComments.id, input.replyToId))
      .limit(1);
    if (
      parent &&
      parent.postId === input.postId &&
      parent.replyToId == null
    ) {
      replyToId = input.replyToId;
      replyToAuthorId = parent.authorId;
    }
  }

  const now = new Date();
  const [comment] = await db
    .insert(schema.communityPostComments)
    .values({ postId: input.postId, authorId: ctx.userId, body, replyToId })
    .returning({ id: schema.communityPostComments.id });

  await db
    .update(schema.communityPosts)
    .set({ lastActivityAt: now })
    .where(eq(schema.communityPosts.id, input.postId));

  return {
    id: comment.id,
    postAuthorId: post.authorId,
    replyToAuthorId,
  };
}

export async function toggleCommentReaction(input: {
  commentId: number;
  userId: string;
}): Promise<{ reacted: boolean }> {
  const existing = await db
    .select({ id: schema.commentReactions.id })
    .from(schema.commentReactions)
    .where(
      and(
        eq(schema.commentReactions.commentId, input.commentId),
        eq(schema.commentReactions.userId, input.userId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(schema.commentReactions)
      .where(
        and(
          eq(schema.commentReactions.commentId, input.commentId),
          eq(schema.commentReactions.userId, input.userId),
        ),
      );
    return { reacted: false };
  }
  await db
    .insert(schema.commentReactions)
    .values({ commentId: input.commentId, userId: input.userId })
    .onConflictDoNothing();
  return { reacted: true };
}

export async function commentPostId(commentId: number): Promise<number | null> {
  const [row] = await db
    .select({ postId: schema.communityPostComments.postId })
    .from(schema.communityPostComments)
    .where(eq(schema.communityPostComments.id, commentId))
    .limit(1);
  return row?.postId ?? null;
}

export async function setCommentStatus(
  commentId: number,
  status: "visible" | "hidden" | "removed",
) {
  await db
    .update(schema.communityPostComments)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.communityPostComments.id, commentId));
}

/** Guard that `ctx` may moderate the post a comment belongs to. */
export async function assertCanModerateComment(
  ctx: CommunityContext,
  commentId: number,
) {
  const postId = await commentPostId(commentId);
  if (postId == null) throw new Error("Comment not found");
  const post = await getPostMeta(postId);
  if (!post || !canModeratePostRow(ctx, post)) throw new Error("Forbidden");
}
