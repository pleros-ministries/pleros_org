import { desc, eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Admin-set pauses on a member's posting or private messaging after misuse.
 * A row exists only while something is paused.
 */

export type RestrictedMember = {
  userId: string;
  name: string;
  postingBlocked: boolean;
  messagingBlocked: boolean;
  reason: string | null;
  updatedAt: string;
};

/** Pauses posting and/or messaging; omitted flags keep their current value. */
export async function restrictMember(input: {
  userId: string;
  posting?: boolean;
  messaging?: boolean;
  reason?: string | null;
  setBy: string;
}) {
  const reason = input.reason?.trim().slice(0, 300) || null;
  const now = new Date();

  await db
    .insert(schema.communityRestrictions)
    .values({
      userId: input.userId,
      postingBlocked: input.posting ?? false,
      messagingBlocked: input.messaging ?? false,
      reason,
      setBy: input.setBy,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.communityRestrictions.userId,
      set: {
        ...(input.posting !== undefined ? { postingBlocked: input.posting } : {}),
        ...(input.messaging !== undefined
          ? { messagingBlocked: input.messaging }
          : {}),
        ...(reason ? { reason } : {}),
        setBy: input.setBy,
        updatedAt: now,
      },
    });
}

/** Lifts every pause on a member. */
export async function clearRestriction(userId: string) {
  await db
    .delete(schema.communityRestrictions)
    .where(eq(schema.communityRestrictions.userId, userId));
}

/** Members with an active pause — admin-only (full names). */
export async function listRestrictedMembers(): Promise<RestrictedMember[]> {
  const rows = await db
    .select({
      userId: schema.communityRestrictions.userId,
      name: schema.users.name,
      postingBlocked: schema.communityRestrictions.postingBlocked,
      messagingBlocked: schema.communityRestrictions.messagingBlocked,
      reason: schema.communityRestrictions.reason,
      updatedAt: schema.communityRestrictions.updatedAt,
    })
    .from(schema.communityRestrictions)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.communityRestrictions.userId),
    )
    .where(
      or(
        eq(schema.communityRestrictions.postingBlocked, true),
        eq(schema.communityRestrictions.messagingBlocked, true),
      ),
    )
    .orderBy(desc(schema.communityRestrictions.updatedAt))
    .limit(200);

  return rows.map((row) => ({
    ...row,
    updatedAt: row.updatedAt.toISOString(),
  }));
}
