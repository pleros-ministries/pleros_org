import { cache } from "react";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getAppSession } from "@/lib/app-session";
import { hasAdminAccess } from "@/lib/app-role";
import { isMinor } from "@/lib/community/messaging";

export type CommunityContext = {
  userId: string;
  isAdmin: boolean;
  enrollmentId: number | null;
  /** When the learner first enrolled — drives the new-member posting wait. */
  enrolledAt: Date | null;
  unit: {
    id: number;
    name: string;
    telegramUrl: string | null;
  } | null;
  membershipRole: "member" | "leader" | null;
  isUnitLeader: boolean;
  /** Location groups this user is the assigned pastor for (`pastor_regions`). */
  managedUnitIds: number[];
  /** Under 18 by year of birth; limits who they exchange private messages with. */
  isMinor: boolean;
  /** Admin restrictions after misuse. */
  postingBlocked: boolean;
  messagingBlocked: boolean;
};

async function loadCommunityContext(): Promise<CommunityContext | null> {
  const session = await getAppSession();
  if (!session) return null;

  const isAdmin = hasAdminAccess(session.user.role);

  const [[row], managedUnits] = await Promise.all([
    loadMembershipRow(session.user.id),
    db
      .select({ unitId: schema.pastorRegions.unitId })
      .from(schema.pastorRegions)
      .where(eq(schema.pastorRegions.pastorUserId, session.user.id)),
  ]);

  return {
    userId: session.user.id,
    isAdmin,
    enrollmentId: row?.enrollmentId ?? null,
    enrolledAt: row?.enrolledAt ?? null,
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
    managedUnitIds: managedUnits.map((unit) => unit.unitId),
    isMinor: isMinor(row?.latestBirthYear ?? null),
    postingBlocked: row?.postingBlocked ?? false,
    messagingBlocked: row?.messagingBlocked ?? false,
  };
}

/** The learner's oldest enrolment with its unit, plus any admin restriction. */
function loadMembershipRow(userId: string) {
  return db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      enrolledAt: schema.sogpEnrollments.createdAt,
      membershipRole: schema.unitMembers.role,
      unitId: schema.units.id,
      unitName: schema.units.name,
      unitTelegramUrl: schema.units.telegramUrl,
      postingBlocked: schema.communityRestrictions.postingBlocked,
      messagingBlocked: schema.communityRestrictions.messagingBlocked,
      // A learner can hold several enrolments; the latest year is the safest reading.
      latestBirthYear: sql<number | null>`(
        select max(${schema.sogpEnrollments.birthYear})
        from ${schema.sogpEnrollments}
        where ${schema.sogpEnrollments.userId} = ${userId}
      )`,
    })
    .from(schema.users)
    .leftJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.userId, schema.users.id),
    )
    .leftJoin(
      schema.unitMembers,
      eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
    )
    .leftJoin(
      schema.units,
      eq(schema.units.id, schema.unitMembers.unitId),
    )
    .leftJoin(
      schema.communityRestrictions,
      eq(schema.communityRestrictions.userId, schema.users.id),
    )
    .where(eq(schema.users.id, userId))
    .orderBy(schema.sogpEnrollments.createdAt)
    .limit(1);
}

/**
 * The single gate for every community route, action, and query. Community
 * access needs an enrolment, admin rights or an assigned pastor region;
 * `isUnitLeader` is authority over `unit.id` only and `managedUnitIds` over
 * those units. Request-cached so the layout and page share one query.
 */
export const getCommunityContext = cache(loadCommunityContext);

/** True when the learner may see any community surface. */
export function canAccessCommunity(ctx: CommunityContext | null): boolean {
  return Boolean(
    ctx &&
      (ctx.enrollmentId !== null ||
        ctx.isAdmin ||
        ctx.managedUnitIds.length > 0),
  );
}
