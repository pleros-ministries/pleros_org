"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import {
  createUnitPost,
  setPostStatus,
  togglePostReaction,
} from "@/lib/db/queries/community-posts";

export async function toggleCommunityReaction(postId: number) {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  const result = await togglePostReaction({ postId, userId: ctx.userId });
  revalidatePath("/dashboard/community");
  return result;
}

/** Unit leader posts to their own unit. */
export async function createLeaderUnitPost(input: {
  title: string;
  body: string;
}) {
  const ctx = await getCommunityContext();
  if (!ctx || (!ctx.isUnitLeader && !ctx.isAdmin) || !ctx.unit) {
    throw new Error("Forbidden");
  }
  const body = input.body.trim();
  if (!body) throw new Error("A post needs a body.");
  await createUnitPost({
    authorId: ctx.userId,
    unitId: ctx.unit.id,
    title: input.title.trim() || null,
    body,
  });
  revalidatePath("/dashboard/community");
}

/** A unit leader hides one of their own unit's posts (admins hide anything). */
export async function hideUnitPost(input: { postId: number }) {
  const ctx = await getCommunityContext();
  if (!ctx) throw new Error("Forbidden");

  const [post] = await db
    .select({
      scope: schema.communityPosts.scope,
      unitId: schema.communityPosts.unitId,
    })
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, input.postId))
    .limit(1);
  if (!post) throw new Error("Post not found");

  const allowed =
    ctx.isAdmin ||
    (ctx.isUnitLeader &&
      post.scope === "unit" &&
      post.unitId === ctx.unit?.id);
  if (!allowed) throw new Error("Forbidden");

  await setPostStatus(input.postId, "hidden");
  revalidatePath("/dashboard/community");
}
