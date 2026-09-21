"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { canPostAnywhere } from "@/lib/community/permissions";
import {
  notifyCommentReply,
  notifyPostComment,
} from "@/lib/community/notify";
import type { CommunityContext } from "@/lib/community/context";
import type { PostImage } from "@/lib/db/queries/community-posts";
import {
  assertCanModeratePost,
  createFeedPost,
  flagContent,
  getPost,
  getPostMeta,
  setPostStatus,
  sharePost,
  togglePostReaction,
} from "@/lib/db/queries/community-posts";
import {
  addComment,
  assertCanModerateComment,
  commentPostId,
  listComments,
  setCommentStatus,
  toggleCommentReaction,
} from "@/lib/db/queries/community-comments";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Community access + authority to create a post somewhere (leader or admin). */
async function requirePoster(): Promise<CommunityContext> {
  const ctx = await requireCommunity();
  if (!canPostAnywhere(ctx)) {
    throw new Error("Only leaders and admins can post here.");
  }
  return ctx;
}

// ─── Posts ────────────────────────────────────────────────────────────────

export async function createPost(input: {
  scope: "global" | "unit";
  title?: string | null;
  body: string;
  images?: PostImage[];
}) {
  const ctx = await requirePoster();
  const post = await createFeedPost({
    ctx,
    scope: input.scope,
    title: input.title ?? null,
    body: input.body,
    images: input.images ?? [],
  });
  revalidatePath("/dashboard/community");
  if (ctx.unit) revalidatePath(`/dashboard/community/unit/${ctx.unit.id}`);
  return post;
}

export async function toggleCommunityReaction(postId: number) {
  const ctx = await requireCommunity();
  const result = await togglePostReaction({ postId, userId: ctx.userId });
  revalidatePath("/dashboard/community");
  revalidatePath(`/dashboard/community/post/${postId}`);
  return result;
}

export async function sharePostToFeed(input: {
  sourcePostId: number;
  scope: "global" | "unit";
  note: string;
}) {
  const ctx = await requirePoster();
  const post = await sharePost({
    ctx,
    sourcePostId: input.sourcePostId,
    scope: input.scope,
    note: input.note,
  });
  revalidatePath("/dashboard/community");
  if (ctx.unit) revalidatePath(`/dashboard/community/unit/${ctx.unit.id}`);
  return post;
}

/** A leader/admin hides a post (leaders only within their own unit). */
export async function moderatePost(input: {
  postId: number;
  action: "hide" | "restore" | "remove";
}) {
  const ctx = await requireCommunity();
  await assertCanModeratePost(ctx, input.postId);
  await setPostStatus(
    input.postId,
    input.action === "hide"
      ? "hidden"
      : input.action === "remove"
        ? "removed"
        : "published",
  );
  revalidatePath("/dashboard/community");
  revalidatePath(`/dashboard/community/post/${input.postId}`);
}

// ─── Comments ─────────────────────────────────────────────────────────────

export async function loadComments(postId: number) {
  const ctx = await requireCommunity();
  return listComments(ctx, postId);
}

export async function commentOnPost(input: {
  postId: number;
  body: string;
  replyToId?: number | null;
}) {
  const ctx = await requireCommunity();
  const result = await addComment(ctx, input);

  const meta = await getPostMeta(input.postId);
  const title = meta?.title ?? null;
  after(() =>
    (async () => {
      if (input.replyToId) {
        await notifyCommentReply({
          postId: input.postId,
          postTitle: title,
          parentAuthorId: result.replyToAuthorId,
          actorId: ctx.userId,
        });
      }
      await notifyPostComment({
        postId: input.postId,
        postTitle: title,
        postAuthorId: result.postAuthorId,
        actorId: ctx.userId,
      });
    })().catch((error) =>
      console.error("Comment notification failed:", error),
    ),
  );

  revalidatePath("/dashboard/community");
  revalidatePath(`/dashboard/community/post/${input.postId}`);
  return { id: result.id };
}

export async function toggleCommentLike(commentId: number) {
  const ctx = await requireCommunity();
  const result = await toggleCommentReaction({ commentId, userId: ctx.userId });
  const postId = await commentPostId(commentId);
  if (postId != null) {
    revalidatePath(`/dashboard/community/post/${postId}`);
  }
  return result;
}

export async function moderateComment(input: {
  commentId: number;
  action: "hide" | "remove" | "restore";
}) {
  const ctx = await requireCommunity();
  await assertCanModerateComment(ctx, input.commentId);
  await setCommentStatus(
    input.commentId,
    input.action === "hide"
      ? "hidden"
      : input.action === "remove"
        ? "removed"
        : "visible",
  );
  const postId = await commentPostId(input.commentId);
  if (postId != null) {
    revalidatePath(`/dashboard/community/post/${postId}`);
    revalidatePath("/dashboard/community");
  }
}

// ─── Reporting ────────────────────────────────────────────────────────────

export async function reportContent(input: {
  targetType: "post" | "comment";
  targetId: number;
  reason: string;
}) {
  const ctx = await requireCommunity();
  await flagContent({ ...input, reporterId: ctx.userId });
  revalidatePath("/dashboard/community");
}

/** Fetch a single post for the client after a mutation (detail page). */
export async function loadPost(postId: number) {
  const ctx = await requireCommunity();
  return getPost(ctx, postId);
}
