import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";

/**
 * How each new enrolment reached its follow-up owner. A code assigns directly;
 * a link assigns and asks the learner to accept or request someone else;
 * a direct join uses the geographical pastor. Ownership never implies group
 * membership, a church appointment or staff access.
 */

export type FollowUpRouteSource = "code" | "link" | "geography";

const referrer = alias(s.sogpEnrollments, "referrer");

export async function recordFollowUpRoute(input: { enrollmentId: number; source: FollowUpRouteSource; ownerUserId: string }) {
  await db.insert(s.sogpFollowUpRoutes).values(input).onConflictDoNothing();
}

async function latestOwnEnrollment(userId: string) {
  const [row] = await db.select({ id: s.sogpEnrollments.id, firstName: s.sogpEnrollments.firstName })
    .from(s.sogpEnrollments).where(eq(s.sogpEnrollments.userId, userId))
    .orderBy(desc(s.sogpEnrollments.createdAt)).limit(1);
  return row ?? null;
}

export type FollowUpWelcome = {
  learnerFirstName: string;
  source: FollowUpRouteSource | null;
  ownerName: string | null;
  /** The owner's own referral code, shown only on the code-arrival screen. */
  ownerCode: string | null;
  /** Link arrivals: null until the learner accepts or asks for someone else. */
  choice: "accepted" | "requested" | null;
  /** The route owner still holds the assignment (an admin may have moved it). */
  ownerCurrent: boolean;
};

export async function getOwnFollowUpWelcome(userId: string): Promise<FollowUpWelcome | null> {
  const enrollment = await latestOwnEnrollment(userId);
  if (!enrollment) return null;
  const [[route], [assignment]] = await Promise.all([
    db.select({ source: s.sogpFollowUpRoutes.source, ownerUserId: s.sogpFollowUpRoutes.ownerUserId, choice: s.sogpFollowUpRoutes.choice })
      .from(s.sogpFollowUpRoutes).where(eq(s.sogpFollowUpRoutes.enrollmentId, enrollment.id)).limit(1),
    db.select({ ownerUserId: s.pastorAssignments.pastorUserId, ownerName: s.users.name })
      .from(s.pastorAssignments).innerJoin(s.users, eq(s.users.id, s.pastorAssignments.pastorUserId))
      .where(eq(s.pastorAssignments.enrollmentId, enrollment.id)).limit(1),
  ]);
  let ownerCode: string | null = null;
  if (route?.source === "code") {
    const [owner] = await db.select({ code: referrer.referralCode }).from(s.sogpEnrollments)
      .innerJoin(referrer, eq(referrer.id, s.sogpEnrollments.referredByEnrollmentId))
      .where(eq(s.sogpEnrollments.id, enrollment.id)).limit(1);
    ownerCode = owner?.code ?? null;
  }
  return {
    learnerFirstName: enrollment.firstName,
    source: route?.source ?? null,
    ownerName: assignment?.ownerName ?? null,
    ownerCode,
    choice: route?.choice ?? null,
    ownerCurrent: Boolean(route?.ownerUserId && assignment?.ownerUserId === route.ownerUserId),
  };
}

/** Link arrival: the learner keeps the link owner. Session-derived; idempotent. */
export async function acceptLinkOwner(userId: string) {
  const enrollment = await latestOwnEnrollment(userId);
  if (!enrollment) throw new CommunityError("An SOGP enrolment is required.");
  const [assignment] = await db.select({ ownerUserId: s.pastorAssignments.pastorUserId }).from(s.pastorAssignments)
    .where(eq(s.pastorAssignments.enrollmentId, enrollment.id)).limit(1);
  const updated = await db.update(s.sogpFollowUpRoutes).set({ choice: "accepted", chosenAt: new Date() })
    .where(and(eq(s.sogpFollowUpRoutes.enrollmentId, enrollment.id), eq(s.sogpFollowUpRoutes.source, "link"), isNull(s.sogpFollowUpRoutes.choice),
      eq(s.sogpFollowUpRoutes.ownerUserId, assignment?.ownerUserId ?? "")))
    .returning({ id: s.sogpFollowUpRoutes.enrollmentId });
  if (!updated.length) {
    const [route] = await db.select({ choice: s.sogpFollowUpRoutes.choice }).from(s.sogpFollowUpRoutes).where(eq(s.sogpFollowUpRoutes.enrollmentId, enrollment.id)).limit(1);
    if (route?.choice !== "accepted") throw new CommunityError("This choice is no longer available. Your current follow-up is unchanged.");
  }
}

/** A learner-facing "My enrollees" row. Names and dates only; contact details stay with staff tools. */
export type OwnEnrolleeRow = {
  enrollmentId: number;
  name: string;
  source: FollowUpRouteSource | "reassigned" | "assigned";
  assignedAt: string;
  lastContactedAt: string | null;
  /** Their current discipleship group. A group's name is shown only to its own leader. */
  group: { yours: boolean; name: string | null } | null;
  /** A pending invitation into one of the viewer's groups. */
  invited: boolean;
  /** First name of the member who handed them over (not an admin reassignment). */
  handedOverBy?: string | null;
};

const assigner = alias(s.users, "enrollee_assigner");

/** Enrollees whose follow-up the viewer owns, across every source. */
export async function listOwnEnrollees(userId: string): Promise<OwnEnrolleeRow[]> {
  const rows = await db.select({
    enrollmentId: s.pastorAssignments.enrollmentId, name: s.sogpEnrollments.name, assignedAt: s.pastorAssignments.assignedAt,
    assignedBy: s.pastorAssignments.assignedBy, lastContactedAt: s.pastorAssignments.lastContactedAt,
    routeSource: s.sogpFollowUpRoutes.source, routeOwner: s.sogpFollowUpRoutes.ownerUserId,
    assignerName: assigner.name, assignerRole: assigner.role,
  }).from(s.pastorAssignments)
    .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.pastorAssignments.enrollmentId))
    .leftJoin(assigner, eq(assigner.id, s.pastorAssignments.assignedBy))
    .leftJoin(s.sogpFollowUpRoutes, eq(s.sogpFollowUpRoutes.enrollmentId, s.pastorAssignments.enrollmentId))
    .where(eq(s.pastorAssignments.pastorUserId, userId))
    .orderBy(desc(s.pastorAssignments.assignedAt)).limit(200);
  const ids = rows.map(row => row.enrollmentId);
  const leader = alias(s.sogpEnrollments, "enrollee_group_leader");
  const [memberships, invitations] = ids.length ? await Promise.all([
    db.select({ enrollmentId: s.discipleshipMemberships.discipleEnrollmentId, name: s.discipleshipGroups.name, leaderUserId: leader.userId })
      .from(s.discipleshipMemberships)
      .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
      .innerJoin(leader, eq(leader.id, s.discipleshipGroups.leaderEnrollmentId))
      .where(and(inArray(s.discipleshipMemberships.discipleEnrollmentId, ids), eq(s.discipleshipMemberships.status, "active"))),
    db.select({ enrollmentId: s.discipleshipGroupInvitations.recipientEnrollmentId })
      .from(s.discipleshipGroupInvitations)
      .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipGroupInvitations.groupId))
      .innerJoin(leader, and(eq(leader.id, s.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, userId)))
      .where(and(inArray(s.discipleshipGroupInvitations.recipientEnrollmentId, ids), eq(s.discipleshipGroupInvitations.status, "pending"))),
  ]) : [[], []];
  const groupOf = new Map(memberships.map(row => [row.enrollmentId, row]));
  const invited = new Set(invitations.map(row => row.enrollmentId));
  return rows.map(row => {
    const membership = groupOf.get(row.enrollmentId);
    const yours = membership?.leaderUserId === userId;
    return {
      enrollmentId: row.enrollmentId,
      name: row.name,
      source: row.routeSource && row.routeOwner === userId ? row.routeSource : row.assignedBy ? "reassigned" : "assigned",
      assignedAt: new Date(row.assignedAt).toISOString(),
      lastContactedAt: row.lastContactedAt ? new Date(row.lastContactedAt).toISOString() : null,
      group: membership ? { yours, name: yours ? membership.name : null } : null,
      invited: !membership && invited.has(row.enrollmentId),
      handedOverBy: row.assignedBy && row.assignedBy !== userId && row.assignerName && row.assignerRole !== "admin" && row.assignerRole !== "super_admin"
        ? row.assignerName.trim().split(/\s+/)[0] ?? null : null,
    };
  });
}
