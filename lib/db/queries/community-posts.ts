import { and, asc, desc, eq, gt, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
import {
  assertCanComment,
  assertCanCreatePost,
} from "@/lib/community/rate-limit";

export type PostImage = { url: string; key: string };

export type SharedFromPost = {
  id: number;
  authorName: string;
  body: string;
  images: PostImage[];
};

export type FeedPost = {
  id: number;
  scope: "global" | "unit";
  unitId: number | null;
  unitName: string | null;
  authorKind: "ministry" | "leader" | "member";
  authorName: string;
  title: string | null;
  body: string;
  images: PostImage[];
  pinned: boolean;
  publishedAt: string;
  lastActivityAt: string;
  reactionCount: number;
  reactedByMe: boolean;
  commentCount: number;
  shareCount: number;
  sharedFrom: SharedFromPost | null;
  isMine: boolean;
  canManage: boolean;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

function displayAuthor(authorKind: FeedPost["authorKind"], name: string | null) {
  return authorKind === "ministry" ? "Pleros" : firstName(name ?? "Someone");
}

function normaliseImages(value: unknown): PostImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is PostImage =>
        Boolean(item) &&
        typeof (item as PostImage).url === "string" &&
        typeof (item as PostImage).key === "string",
    )
    .slice(0, 4);
}

const srcPost = alias(schema.communityPosts, "src_post");
const srcAuthor = alias(schema.users, "src_author");

/** Shared column set for every feed-style read. */
function feedColumns(ctx: CommunityContext) {
  return {
    post: schema.communityPosts,
    authorName: schema.users.name,
    unitName: schema.units.name,
    srcId: srcPost.id,
    srcBody: srcPost.body,
    srcImages: srcPost.images,
    srcStatus: srcPost.status,
    srcAuthorKind: srcPost.authorKind,
    srcAuthorName: srcAuthor.name,
    reactionCount: sql<number>`(
      select count(*) from ${schema.postReactions}
      where ${schema.postReactions.postId} = ${schema.communityPosts.id}
    )::int`,
    reactedByMe: sql<boolean>`exists (
      select 1 from ${schema.postReactions}
      where ${schema.postReactions.postId} = ${schema.communityPosts.id}
        and ${schema.postReactions.userId} = ${ctx.userId}
    )`,
  } as const;
}

type FeedRow = {
  post: typeof schema.communityPosts.$inferSelect;
  authorName: string | null;
  unitName: string | null;
  srcId: number | null;
  srcBody: string | null;
  srcImages: unknown;
  srcStatus: "published" | "hidden" | "removed" | null;
  srcAuthorKind: "ministry" | "leader" | "member" | null;
  srcAuthorName: string | null;
  reactionCount: number;
  reactedByMe: boolean;
};

function mapFeedRow(row: FeedRow, ctx: CommunityContext): FeedPost {
  const sharedFrom: SharedFromPost | null =
    row.srcId != null && row.srcStatus === "published"
      ? {
          id: row.srcId,
          authorName: displayAuthor(
            row.srcAuthorKind ?? "member",
            row.srcAuthorName,
          ),
          body: row.srcBody ?? "",
          images: normaliseImages(row.srcImages),
        }
      : null;

  return {
    id: row.post.id,
    scope: row.post.scope,
    unitId: row.post.unitId,
    unitName: row.post.scope === "unit" ? row.unitName : null,
    authorKind: row.post.authorKind,
    authorName: displayAuthor(row.post.authorKind, row.authorName),
    title: row.post.title,
    body: row.post.body,
    images: normaliseImages(row.post.images),
    pinned: row.post.pinned,
    publishedAt: row.post.publishedAt.toISOString(),
    lastActivityAt: row.post.lastActivityAt.toISOString(),
    reactionCount: row.reactionCount,
    reactedByMe: row.reactedByMe,
    commentCount: row.post.commentCount,
    shareCount: row.post.shareCount,
    sharedFrom,
    isMine: row.post.authorId === ctx.userId,
    canManage:
      ctx.isAdmin ||
      (ctx.isUnitLeader &&
        row.post.scope === "unit" &&
        row.post.unitId === ctx.unit?.id),
  };
}

function baseFeedQuery(ctx: CommunityContext) {
  return db
    .select(feedColumns(ctx))
    .from(schema.communityPosts)
    .innerJoin(schema.users, eq(schema.users.id, schema.communityPosts.authorId))
    .leftJoin(schema.units, eq(schema.units.id, schema.communityPosts.unitId))
    .leftJoin(srcPost, eq(srcPost.id, schema.communityPosts.sharedFromPostId))
    .leftJoin(srcAuthor, eq(srcAuthor.id, srcPost.authorId));
}

/** Global posts + the learner's own-unit posts, pinned first then most active. */
export async function getCommunityFeed(
  ctx: CommunityContext,
): Promise<FeedPost[]> {
  const scopeFilter = ctx.unit
    ? or(
        eq(schema.communityPosts.scope, "global"),
        and(
          eq(schema.communityPosts.scope, "unit"),
          eq(schema.communityPosts.unitId, ctx.unit.id),
        ),
      )
    : eq(schema.communityPosts.scope, "global");

  const rows = await baseFeedQuery(ctx)
    .where(and(eq(schema.communityPosts.status, "published"), scopeFilter))
    .orderBy(
      desc(schema.communityPosts.pinned),
      desc(schema.communityPosts.lastActivityAt),
    )
    .limit(100);

  return rows.map((row) => mapFeedRow(row as FeedRow, ctx));
}

/** Published posts belonging to one unit only. */
export async function getUnitPosts(
  unitId: number,
  ctx: CommunityContext,
): Promise<FeedPost[]> {
  const rows = await baseFeedQuery(ctx)
    .where(
      and(
        eq(schema.communityPosts.status, "published"),
        eq(schema.communityPosts.scope, "unit"),
        eq(schema.communityPosts.unitId, unitId),
      ),
    )
    .orderBy(
      desc(schema.communityPosts.pinned),
      desc(schema.communityPosts.lastActivityAt),
    )
    .limit(50);

  return rows.map((row) => mapFeedRow(row as FeedRow, ctx));
}

/** A single post for the detail page / share deep-link. */
export async function getPost(
  ctx: CommunityContext,
  postId: number,
): Promise<FeedPost | null> {
  const rows = await baseFeedQuery(ctx)
    .where(eq(schema.communityPosts.id, postId))
    .limit(1);
  const row = rows[0] as FeedRow | undefined;
  if (!row) return null;
  if (row.post.status !== "published" && !ctx.isAdmin) return null;

  // Scope guard: a unit post is only visible to that unit + admins.
  if (
    row.post.scope === "unit" &&
    !ctx.isAdmin &&
    row.post.unitId !== ctx.unit?.id
  ) {
    return null;
  }
  return mapFeedRow(row, ctx);
}

export type CommunitySidebar = {
  latest: Array<Pick<FeedPost, "id" | "title" | "body" | "authorName">>;
  active: Array<
    Pick<FeedPost, "id" | "title" | "body" | "authorName" | "commentCount">
  >;
};

/** Right-rail payload: newest posts + the ones with live discussion. */
export async function getCommunitySidebar(
  ctx: CommunityContext,
): Promise<CommunitySidebar> {
  const scopeFilter = ctx.unit
    ? or(
        eq(schema.communityPosts.scope, "global"),
        and(
          eq(schema.communityPosts.scope, "unit"),
          eq(schema.communityPosts.unitId, ctx.unit.id),
        ),
      )
    : eq(schema.communityPosts.scope, "global");

  const cols = {
    id: schema.communityPosts.id,
    title: schema.communityPosts.title,
    body: schema.communityPosts.body,
    authorKind: schema.communityPosts.authorKind,
    authorName: schema.users.name,
    commentCount: schema.communityPosts.commentCount,
  } as const;

  const [latestRows, activeRows] = await Promise.all([
    db
      .select(cols)
      .from(schema.communityPosts)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.communityPosts.authorId),
      )
      .where(and(eq(schema.communityPosts.status, "published"), scopeFilter))
      .orderBy(desc(schema.communityPosts.publishedAt))
      .limit(5),
    db
      .select(cols)
      .from(schema.communityPosts)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.communityPosts.authorId),
      )
      .where(
        and(
          eq(schema.communityPosts.status, "published"),
          gt(schema.communityPosts.commentCount, 0),
          scopeFilter,
        ),
      )
      .orderBy(desc(schema.communityPosts.lastActivityAt))
      .limit(5),
  ]);

  return {
    latest: latestRows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      authorName: displayAuthor(r.authorKind, r.authorName),
    })),
    active: activeRows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      authorName: displayAuthor(r.authorKind, r.authorName),
      commentCount: r.commentCount,
    })),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────

function authorKindFor(ctx: CommunityContext): FeedPost["authorKind"] {
  if (ctx.isAdmin) return "ministry";
  if (ctx.isUnitLeader) return "leader";
  return "member";
}

/**
 * The one create path used by every learner. `scope: "unit"` requires the
 * caller to be in that unit (or an admin).
 */
export async function createFeedPost(input: {
  ctx: CommunityContext;
  scope: "global" | "unit";
  unitId?: number | null;
  title: string | null;
  body: string;
  images?: PostImage[];
}): Promise<{ id: number }> {
  const { ctx } = input;
  await assertCanCreatePost(ctx.userId);

  const body = input.body.trim();
  const images = normaliseImages(input.images);
  if (!body && images.length === 0) {
    throw new Error("Write something or add a photo.");
  }

  let unitId: number | null = null;
  if (input.scope === "unit") {
    unitId = input.unitId ?? ctx.unit?.id ?? null;
    if (!unitId) throw new Error("You are not in a unit yet.");
    if (!ctx.isAdmin && unitId !== ctx.unit?.id) {
      throw new Error("You can only post to your own unit.");
    }
  }

  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: input.scope,
      unitId,
      authorId: ctx.userId,
      authorKind: authorKindFor(ctx),
      title: input.title?.trim() || null,
      body,
      images,
    })
    .returning({ id: schema.communityPosts.id });
  return post;
}

/** Admin/official global post — keeps `ministry` authorship + `images`. */
export async function createGlobalPost(input: {
  authorId: string;
  title: string | null;
  body: string;
  images?: PostImage[];
}) {
  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: "global",
      authorId: input.authorId,
      authorKind: "ministry",
      title: input.title,
      body: input.body,
      images: normaliseImages(input.images),
    })
    .returning({ id: schema.communityPosts.id });
  return post;
}

/**
 * In-app repost. Flattens a reshare-of-a-reshare to its root, copies the
 * sharer's note as the body, and bumps the source's share count.
 */
export async function sharePost(input: {
  ctx: CommunityContext;
  sourcePostId: number;
  scope: "global" | "unit";
  unitId?: number | null;
  note: string;
}): Promise<{ id: number }> {
  const { ctx } = input;
  await assertCanCreatePost(ctx.userId);

  const [source] = await db
    .select({
      id: schema.communityPosts.id,
      status: schema.communityPosts.status,
      scope: schema.communityPosts.scope,
      unitId: schema.communityPosts.unitId,
      sharedFromPostId: schema.communityPosts.sharedFromPostId,
    })
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, input.sourcePostId))
    .limit(1);
  if (!source || source.status !== "published") {
    throw new Error("That post is no longer available.");
  }
  // A unit post can only be reshared by someone who can see it.
  if (
    source.scope === "unit" &&
    !ctx.isAdmin &&
    source.unitId !== ctx.unit?.id
  ) {
    throw new Error("You cannot share that post.");
  }

  const rootId = source.sharedFromPostId ?? source.id;

  let unitId: number | null = null;
  if (input.scope === "unit") {
    unitId = input.unitId ?? ctx.unit?.id ?? null;
    if (!unitId) throw new Error("You are not in a unit yet.");
    if (!ctx.isAdmin && unitId !== ctx.unit?.id) {
      throw new Error("You can only post to your own unit.");
    }
  }

  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: input.scope,
      unitId,
      authorId: ctx.userId,
      authorKind: authorKindFor(ctx),
      title: null,
      body: input.note.trim(),
      sharedFromPostId: rootId,
    })
    .returning({ id: schema.communityPosts.id });

  await db
    .update(schema.communityPosts)
    .set({ shareCount: sql`${schema.communityPosts.shareCount} + 1` })
    .where(eq(schema.communityPosts.id, rootId));

  return post;
}

export async function setPostPinned(postId: number, pinned: boolean) {
  await db
    .update(schema.communityPosts)
    .set({ pinned, updatedAt: new Date() })
    .where(eq(schema.communityPosts.id, postId));
}

export async function setPostStatus(
  postId: number,
  status: "published" | "hidden" | "removed",
) {
  await db
    .update(schema.communityPosts)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.communityPosts.id, postId));
}

export async function editPost(input: {
  postId: number;
  title: string | null;
  body: string;
  images?: PostImage[];
}) {
  await db
    .update(schema.communityPosts)
    .set({
      title: input.title,
      body: input.body,
      ...(input.images ? { images: normaliseImages(input.images) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.communityPosts.id, input.postId));
}

/** Author + scope of a post — used to gate report / moderation. */
export async function getPostMeta(postId: number) {
  const [row] = await db
    .select({
      id: schema.communityPosts.id,
      authorId: schema.communityPosts.authorId,
      scope: schema.communityPosts.scope,
      unitId: schema.communityPosts.unitId,
      title: schema.communityPosts.title,
      images: schema.communityPosts.images,
      status: schema.communityPosts.status,
    })
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, postId))
    .limit(1);
  return row ?? null;
}

export function canModeratePostRow(
  ctx: CommunityContext,
  row: { scope: "global" | "unit"; unitId: number | null },
) {
  return (
    ctx.isAdmin ||
    (ctx.isUnitLeader && row.scope === "unit" && row.unitId === ctx.unit?.id)
  );
}

export async function assertCanModeratePost(
  ctx: CommunityContext,
  postId: number,
) {
  const row = await getPostMeta(postId);
  if (!row) throw new Error("Post not found");
  if (!canModeratePostRow(ctx, row)) throw new Error("Forbidden");
}

/** Idempotent toggle of the current user's "like" on a post. */
export async function togglePostReaction(input: {
  postId: number;
  userId: string;
}): Promise<{ reacted: boolean }> {
  const existing = await db
    .select({ id: schema.postReactions.id })
    .from(schema.postReactions)
    .where(
      and(
        eq(schema.postReactions.postId, input.postId),
        eq(schema.postReactions.userId, input.userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(schema.postReactions)
      .where(
        and(
          eq(schema.postReactions.postId, input.postId),
          eq(schema.postReactions.userId, input.userId),
        ),
      );
    return { reacted: false };
  }

  await db
    .insert(schema.postReactions)
    .values({ postId: input.postId, userId: input.userId })
    .onConflictDoNothing();
  return { reacted: true };
}

// ─── Moderation queue (ported from the old discussion module) ──────────────

export async function flagContent(input: {
  reporterId: string;
  targetType: "post" | "comment";
  targetId: number;
  reason: string;
}) {
  await db
    .insert(schema.contentFlags)
    .values({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim().slice(0, 500) || "Reported",
    })
    .onConflictDoNothing();
}

export type OpenFlag = {
  id: number;
  targetType: "post" | "comment";
  targetId: number;
  reason: string;
  reporterName: string;
  createdAt: string;
  preview: string | null;
};

/** Open flags an admin (all) or a leader (own unit) should action. */
export async function listOpenFlags(
  ctx: CommunityContext,
): Promise<OpenFlag[]> {
  const rows = await db
    .select({
      flag: schema.contentFlags,
      reporterName: schema.users.name,
    })
    .from(schema.contentFlags)
    .innerJoin(schema.users, eq(schema.users.id, schema.contentFlags.reporterId))
    .where(eq(schema.contentFlags.status, "open"))
    .orderBy(asc(schema.contentFlags.createdAt))
    .limit(200);

  const postIds = rows
    .filter((r) => r.flag.targetType === "post")
    .map((r) => r.flag.targetId);
  const commentIds = rows
    .filter((r) => r.flag.targetType === "comment")
    .map((r) => r.flag.targetId);

  const [posts, comments] = await Promise.all([
    postIds.length
      ? db
          .select({
            id: schema.communityPosts.id,
            body: schema.communityPosts.body,
            unitId: schema.communityPosts.unitId,
            scope: schema.communityPosts.scope,
          })
          .from(schema.communityPosts)
          .where(inArray(schema.communityPosts.id, postIds))
      : Promise.resolve([]),
    commentIds.length
      ? db
          .select({
            id: schema.communityPostComments.id,
            body: schema.communityPostComments.body,
            postId: schema.communityPostComments.postId,
          })
          .from(schema.communityPostComments)
          .where(inArray(schema.communityPostComments.id, commentIds))
      : Promise.resolve([]),
  ]);

  const commentPosts = comments.length
    ? await db
        .select({
          id: schema.communityPosts.id,
          unitId: schema.communityPosts.unitId,
          scope: schema.communityPosts.scope,
        })
        .from(schema.communityPosts)
        .where(
          inArray(
            schema.communityPosts.id,
            comments.map((c) => c.postId),
          ),
        )
    : [];

  const postById = new Map(posts.map((p) => [p.id, p]));
  const commentById = new Map(comments.map((c) => [c.id, c]));
  const postMetaById = new Map(commentPosts.map((p) => [p.id, p]));

  function unitScopeOf(flag: (typeof rows)[number]["flag"]): {
    scope: "global" | "unit";
    unitId: number | null;
  } | null {
    if (flag.targetType === "post") {
      const p = postById.get(flag.targetId);
      return p ? { scope: p.scope, unitId: p.unitId } : null;
    }
    const c = commentById.get(flag.targetId);
    if (!c) return null;
    const p = postMetaById.get(c.postId);
    return p ? { scope: p.scope, unitId: p.unitId } : null;
  }

  return rows
    .filter((row) => {
      if (row.flag.targetType !== "post" && row.flag.targetType !== "comment") {
        return false;
      }
      if (ctx.isAdmin) return true;
      const meta = unitScopeOf(row.flag);
      return (
        meta &&
        meta.scope === "unit" &&
        meta.unitId === ctx.unit?.id &&
        ctx.isUnitLeader
      );
    })
    .map((row) => {
      let preview: string | null = null;
      if (row.flag.targetType === "post") {
        preview = postById.get(row.flag.targetId)?.body.slice(0, 80) ?? null;
      } else {
        preview = commentById.get(row.flag.targetId)?.body.slice(0, 80) ?? null;
      }
      return {
        id: row.flag.id,
        targetType: row.flag.targetType as "post" | "comment",
        targetId: row.flag.targetId,
        reason: row.flag.reason,
        reporterName: firstName(row.reporterName),
        createdAt: row.flag.createdAt.toISOString(),
        preview,
      };
    });
}

export async function resolveFlag(input: {
  flagId: number;
  handledBy: string;
  status: "actioned" | "dismissed";
}) {
  await db
    .update(schema.contentFlags)
    .set({
      status: input.status,
      handledBy: input.handledBy,
      handledAt: new Date(),
    })
    .where(eq(schema.contentFlags.id, input.flagId));
}

export type AdminPost = {
  id: number;
  title: string | null;
  body: string;
  pinned: boolean;
  status: "published" | "hidden" | "removed";
  publishedAt: string;
};

export async function listGlobalPosts(): Promise<AdminPost[]> {
  const rows = await db
    .select()
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.scope, "global"))
    .orderBy(desc(schema.communityPosts.publishedAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    status: row.status,
    publishedAt: row.publishedAt.toISOString(),
  }));
}

/** Title + body of a global post — used by the admin Telegram mirror. */
export async function getPostForBroadcast(postId: number) {
  const [row] = await db
    .select({
      title: schema.communityPosts.title,
      body: schema.communityPosts.body,
    })
    .from(schema.communityPosts)
    .where(
      and(
        eq(schema.communityPosts.id, postId),
        inArray(schema.communityPosts.scope, ["global"]),
      ),
    )
    .limit(1);
  return row ?? null;
}
