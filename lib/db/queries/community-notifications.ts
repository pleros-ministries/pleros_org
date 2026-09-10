import { and, desc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export type CommunityNotification = {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export async function listNotifications(
  userId: string,
): Promise<CommunityNotification[]> {
  const rows = await db
    .select()
    .from(schema.communityNotifications)
    .where(eq(schema.communityNotifications.userId, userId))
    .orderBy(desc(schema.communityNotifications.createdAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    payload: row.payload,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function countUnread(userId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.communityNotifications)
    .where(
      and(
        eq(schema.communityNotifications.userId, userId),
        isNull(schema.communityNotifications.readAt),
      ),
    );
  return n;
}

export async function markNotificationsRead(userId: string) {
  await db
    .update(schema.communityNotifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.communityNotifications.userId, userId),
        isNull(schema.communityNotifications.readAt),
      ),
    );
}
