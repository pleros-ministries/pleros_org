import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getAppSession } from "@/lib/app-session";
import { hasAdminAccess } from "@/lib/app-role";

export type CommunityContext = {
  userId: string;
  isAdmin: boolean;
  enrollmentId: number | null;
  unit: {
    id: number;
    name: string;
    telegramUrl: string | null;
  } | null;
  membershipRole: "member" | "leader" | null;
  isUnitLeader: boolean;
};

/**
 * The single gate for every community route, action, and query. A learner with
 * `enrollmentId === null` has no community access; `isUnitLeader` is authority
 * over `unit.id` only.
 */
export async function getCommunityContext(): Promise<CommunityContext | null> {
  const session = await getAppSession();
  if (!session) return null;

  const isAdmin = hasAdminAccess(session.user.role);

  const [row] = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      membershipRole: schema.unitMembers.role,
      unitId: schema.units.id,
      unitName: schema.units.name,
      unitTelegramUrl: schema.units.telegramUrl,
    })
    .from(schema.sogpEnrollments)
    .leftJoin(
      schema.unitMembers,
      eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
    )
    .leftJoin(
      schema.units,
      eq(schema.units.id, schema.unitMembers.unitId),
    )
    .where(eq(schema.sogpEnrollments.userId, session.user.id))
    .orderBy(schema.sogpEnrollments.createdAt)
    .limit(1);

  return {
    userId: session.user.id,
    isAdmin,
    enrollmentId: row?.enrollmentId ?? null,
    unit:
      row?.unitId != null
        ? {
            id: row.unitId,
            name: row.unitName!,
            telegramUrl: row.unitTelegramUrl ?? null,
          }
        : null,
    membershipRole: row?.membershipRole ?? null,
    isUnitLeader: row?.membershipRole === "leader",
  };
}

/** True when the learner may see any community surface. */
export function canAccessCommunity(ctx: CommunityContext | null): boolean {
  return Boolean(ctx && (ctx.enrollmentId !== null || ctx.isAdmin));
}
