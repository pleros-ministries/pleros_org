import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";

export type FeedPost = {
  id: number;
  scope: "global" | "unit";
  unitId: number | null;
  unitName: string | null;
  authorKind: "ministry" | "leader";
  authorName: string;
  title: string | null;
  body: string;
  pinned: boolean;
  publishedAt: string;
  reactionCount: number;
  reactedByMe: boolean;
  canManage: boolean;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

/** Global posts + the learner's own-unit posts, pinned first then most recent. */
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

  const rows = await db
    .select({
      post: schema.communityPosts,
      authorName: schema.users.name,
      unitName: schema.units.name,
      reactionCount: sql<number>`(
        select count(*) from ${schema.postReactions}
        where ${schema.postReactions.postId} = ${schema.communityPosts.id}
      )::int`,
      reactedByMe: sql<boolean>`exists (
        select 1 from ${schema.postReactions}
        where ${schema.postReactions.postId} = ${schema.communityPosts.id}
          and ${schema.postReactions.userId} = ${ctx.userId}
      )`,
    })
    .from(schema.communityPosts)
    .innerJoin(schema.users, eq(schema.users.id, schema.communityPosts.authorId))
    .leftJoin(schema.units, eq(schema.units.id, schema.communityPosts.unitId))
    .where(
      and(eq(schema.communityPosts.status, "published"), scopeFilter),
    )
    .orderBy(
      desc(schema.communityPosts.pinned),
      desc(schema.communityPosts.publishedAt),
    )
    .limit(100);

  return rows.map((row) => ({
    id: row.post.id,
    scope: row.post.scope,
    unitId: row.post.unitId,
    unitName: row.post.scope === "unit" ? row.unitName : null,
    authorKind: row.post.authorKind,
    authorName:
      row.post.authorKind === "ministry"
        ? "Pleros"
        : firstName(row.authorName),
    title: row.post.title,
    body: row.post.body,
    pinned: row.post.pinned,
    publishedAt: row.post.publishedAt.toISOString(),
    reactionCount: row.reactionCount,
    reactedByMe: row.reactedByMe,
    canManage:
      ctx.isAdmin ||
      (ctx.isUnitLeader &&
        row.post.scope === "unit" &&
        row.post.unitId === ctx.unit?.id),
  }));
}

/** Published posts belonging to one unit only. */
export async function getUnitPosts(
  unitId: number,
  ctx: CommunityContext,
): Promise<FeedPost[]> {
  const rows = await db
    .select({
      post: schema.communityPosts,
      authorName: schema.users.name,
      unitName: schema.units.name,
      reactionCount: sql<number>`(
        select count(*) from ${schema.postReactions}
        where ${schema.postReactions.postId} = ${schema.communityPosts.id}
      )::int`,
      reactedByMe: sql<boolean>`exists (
        select 1 from ${schema.postReactions}
        where ${schema.postReactions.postId} = ${schema.communityPosts.id}
          and ${schema.postReactions.userId} = ${ctx.userId}
      )`,
    })
    .from(schema.communityPosts)
    .innerJoin(schema.users, eq(schema.users.id, schema.communityPosts.authorId))
    .leftJoin(schema.units, eq(schema.units.id, schema.communityPosts.unitId))
    .where(
      and(
        eq(schema.communityPosts.status, "published"),
        eq(schema.communityPosts.scope, "unit"),
        eq(schema.communityPosts.unitId, unitId),
      ),
    )
    .orderBy(
      desc(schema.communityPosts.pinned),
      desc(schema.communityPosts.publishedAt),
    )
    .limit(50);

  return rows.map((row) => ({
    id: row.post.id,
    scope: row.post.scope,
    unitId: row.post.unitId,
    unitName: row.unitName,
    authorKind: row.post.authorKind,
    authorName:
      row.post.authorKind === "ministry" ? "Pleros" : firstName(row.authorName),
    title: row.post.title,
    body: row.post.body,
    pinned: row.post.pinned,
    publishedAt: row.post.publishedAt.toISOString(),
    reactionCount: row.reactionCount,
    reactedByMe: row.reactedByMe,
    canManage:
      ctx.isAdmin || (ctx.isUnitLeader && row.post.unitId === ctx.unit?.id),
  }));
}

export async function createGlobalPost(input: {
  authorId: string;
  title: string | null;
  body: string;
}) {
  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: "global",
      authorId: input.authorId,
      authorKind: "ministry",
      title: input.title,
      body: input.body,
    })
    .returning({ id: schema.communityPosts.id });
  return post;
}

export async function createUnitPost(input: {
  authorId: string;
  unitId: number;
  title: string | null;
  body: string;
}) {
  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: "unit",
      unitId: input.unitId,
      authorId: input.authorId,
      authorKind: "leader",
      title: input.title,
      body: input.body,
    })
    .returning({ id: schema.communityPosts.id });
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
}) {
  await db
    .update(schema.communityPosts)
    .set({ title: input.title, body: input.body, updatedAt: new Date() })
    .where(eq(schema.communityPosts.id, input.postId));
}

/** Idempotent toggle of the current user's "🙏" on a post. */
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

/** Posts a global post can be pinned to Telegram — used by the admin composer. */
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
