"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import {
  CommunityError,
  POSTING_PAUSED_COPY,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  canPostAnywhere,
  canPostOfficialAnywhere,
} from "@/lib/community/permissions";
import { normalisePostInput, type PostKind } from "@/lib/community/post-input";
import { RateLimitError } from "@/lib/community/rate-limit";
import {
  notifyCommentReply,
  notifyDiscipleshipPost,
  notifyPostComment,
} from "@/lib/community/notify";
import type { CommunityContext } from "@/lib/community/context";
import { listDiscipleshipGroupMembers } from "@/lib/db/queries/community-discipleship";
import type { PostImage, PostScope } from "@/lib/db/queries/community-posts";
import {
  assertCanModeratePost,
  canViewPost,
  createFeedPost,
  editPost,
  flagContent,
  getPost,
  getPostMeta,
  setPostPinned,
  setPostStatus,
  sharePost,
  togglePostReaction,
} from "@/lib/db/queries/community-posts";
import {
  addComment,
  assertCanModerateComment,
  commentPostId,
  getCommentMeta,
  listComments,
  setCommentStatus,
  toggleCommentReaction,
} from "@/lib/db/queries/community-comments";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Community access + the right to raise a post somewhere (any enrolled learner). */
async function requirePoster(): Promise<CommunityContext> {
  const ctx = await requireCommunity();
  if (!canPostAnywhere(ctx)) {
    throw new CommunityError("Enrol in SOGP to post here.");
  }
  if (ctx.postingBlocked) throw new CommunityError(POSTING_PAUSED_COPY);
  return ctx;
}

/** Announcements and reposts stay with leaders and admins. */
async function requireOfficialPoster(): Promise<CommunityContext> {
  const ctx = await requireCommunity();
  if (!canPostOfficialAnywhere(ctx)) {
    throw new Error("Only leaders and admins can share to the feed.");
  }
  return ctx;
}

/**
 * Runs a mutation and returns expected failures as data: the message of a
 * thrown error never reaches the browser in production.
 */
async function run<T extends object>(
  fn: () => Promise<T>,
): Promise<CommunityActionResult<T>> {
  try {
    return { ok: true as const, ...(await fn()) };
  } catch (error) {
    if (error instanceof CommunityError || error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function revalidatePostPaths(postId: number | null, unitId: number | null) {
  revalidatePath("/dashboard/community");
  if (unitId != null) revalidatePath(`/dashboard/community/unit/${unitId}`);
  if (postId != null) revalidatePath(`/dashboard/community/post/${postId}`);
}

// ─── Posts ────────────────────────────────────────────────────────────────

export async function createPost(input: {
  scope: PostScope;
  /**
   * The space to post into: a unit, discipleship group or member group id,
   * matching `scope`. Omit for a community-wide post, or for the viewer's own
   * unit.
   */
  targetId?: number | null;
  kind?: PostKind;
  title?: string | null;
  topic?: string | null;
  body: string;
  images?: PostImage[];
}): Promise<CommunityActionResult<{ id: number }>> {
  return run(async () => {
    const ctx = await requirePoster();
    const targetId = input.targetId ?? null;
    const post = await createFeedPost({
      ctx,
      scope: input.scope,
      unitId: input.scope === "unit" ? targetId : null,
      discipleshipGroupId: input.scope === "discipleship" ? targetId : null,
      groupId: input.scope === "group" ? targetId : null,
      kind: input.kind,
      title: input.title ?? null,
      topic: input.topic ?? null,
      body: input.body,
      images: input.images ?? [],
    });

    if (input.scope === "group" && targetId != null) {
      revalidatePath(`/dashboard/community/groups/${targetId}`);
      return { id: post.id };
    }

    const groupId = input.scope === "discipleship" ? targetId : null;
    if (groupId != null) {
      // A small group should know someone has spoken up. The notification
      // names the author only, never the post's words.
      after(() =>
        (async () => {
          const members = await listDiscipleshipGroupMembers(groupId);
          await notifyDiscipleshipPost({
            postId: post.id,
            recipientUserIds: members.map((member) => member.userId),
            actorUserId: ctx.userId,
            actorFirstName:
              members.find((member) => member.userId === ctx.userId)
                ?.firstName ?? "Someone",
          });
        })().catch((error) =>
          console.error("Discipleship post notification failed:", error),
        ),
      );
      revalidatePath("/dashboard/community/discipleship");
    } else {
      revalidatePostPaths(
        null,
        input.scope === "unit" ? (targetId ?? ctx.unit?.id ?? null) : null,
      );
    }
    return { id: post.id };
  });
}

/** The author edits the words of their own post; photos stay as posted. */
export async function editOwnPost(input: {
  postId: number;
  title: string | null;
  body: string;
  topic?: string | null;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requirePoster();
    const meta = await getPostMeta(input.postId);
    if (!meta || meta.status !== "published") {
      throw new CommunityError("This post is no longer available.");
    }
    if (meta.authorId !== ctx.userId) {
      throw new CommunityError("You can only edit your own posts.");
    }

    const parsed = normalisePostInput({
      kind: meta.kind,
      title: input.title,
      body: input.body,
      topic: input.topic,
      hasImages: meta.images.length > 0,
    });
    if (!parsed.ok) throw new CommunityError(parsed.error);

    await editPost({
      postId: input.postId,
      title: parsed.value.title,
      body: parsed.value.body,
      topic: parsed.value.topic,
    });
    revalidatePostPaths(input.postId, meta.unitId);
    return {};
  });
}

/** The author removes their own post from every feed. */
export async function deleteOwnPost(
  postId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const meta = await getPostMeta(postId);
    if (!meta) throw new CommunityError("This post is no longer available.");
    if (meta.authorId !== ctx.userId) {
      throw new CommunityError("You can only delete your own posts.");
    }
    await setPostStatus(postId, "removed");
    revalidatePostPaths(postId, meta.unitId);
    return {};
  });
}

/** Pin or unpin — admins anywhere, a leader within their own unit. */
export async function togglePostPin(input: { postId: number; pinned: boolean }) {
  const ctx = await requireCommunity();
  await assertCanModeratePost(ctx, input.postId);
  await setPostPinned(input.postId, input.pinned);
  const meta = await getPostMeta(input.postId);
  revalidatePostPaths(input.postId, meta?.unitId ?? null);
}

export async function toggleCommunityReaction(postId: number) {
  const ctx = await requireCommunity();
  const meta = await getPostMeta(postId);
  if (!meta || !(await canViewPost(ctx, meta))) throw new Error("Forbidden");
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
  const ctx = await requireOfficialPoster();
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
  // A discipleship post's title stays out of notifications and push text.
  const title = meta?.scope === "discipleship" ? null : (meta?.title ?? null);
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

/** Flag a post or comment the reporter can see; feeds the moderation queues. */
export async function reportContent(input: {
  targetType: "post" | "comment";
  targetId: number;
  reason: string;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();

    if (input.targetType === "post") {
      const post = await getPost(ctx, input.targetId);
      if (!post) throw new CommunityError("This post is no longer available.");
      if (post.isMine) {
        throw new CommunityError("You can't report your own post.");
      }
    } else {
      const comment = await getCommentMeta(input.targetId);
      if (!comment || comment.status !== "visible") {
        throw new CommunityError("This comment is no longer available.");
      }
      if (comment.authorId === ctx.userId) {
        throw new CommunityError("You can't report your own comment.");
      }
      // The reporter must be able to see the post the comment sits under.
      if (!(await getPost(ctx, comment.postId))) {
        throw new CommunityError("This comment is no longer available.");
      }
    }

    await flagContent({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      reporterId: ctx.userId,
    });
    revalidatePath("/admin/community");
    revalidatePath("/dashboard/community/leader");
    return {};
  });
}

/** Fetch a single post for the client after a mutation (detail page). */
export async function loadPost(postId: number) {
  const ctx = await requireCommunity();
  return getPost(ctx, postId);
}
