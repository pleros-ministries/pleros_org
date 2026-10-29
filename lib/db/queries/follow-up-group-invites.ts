import "server-only";

import { and, desc, eq, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";

import { notifyGroupInvitation } from "@/lib/community/notify";

import { ensureDiscipleshipGroups } from "./sogp-discipleship";

/**
 * SOGP follow-up into groups (groups as oversight, 19 October): whoever is
 * claimed by or assigned to someone is invited into that person's default
 * group, so nobody falls through the cracks. It is only an invitation: they
 * join when they accept, and follow-up ownership stays its own record.
 *
 * These invitations use the `referral` origin, which nothing else writes: it
 * marks an invitation that came from a follow-up assignment. When the owner
 * changes, an older pending one is withdrawn so it can't be accepted instead.
 */
export async function inviteIntoOwnersGroup(input: { enrollmentId: number; ownerUserId: string; invitedBy?: string | null }): Promise<boolean> {
  const [[recipient], [owner]] = await Promise.all([
    db.select({ id: s.sogpEnrollments.id, userId: s.sogpEnrollments.userId }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, input.enrollmentId)).limit(1),
    // A group needs its leader's enrolment; an owner without one (a staff pastor) has no group to offer.
    db.select({ id: s.sogpEnrollments.id, firstName: s.sogpEnrollments.firstName, name: s.sogpEnrollments.name })
      .from(s.sogpEnrollments)
      .where(and(eq(s.sogpEnrollments.userId, input.ownerUserId), ne(s.sogpEnrollments.status, "withdrawn")))
      .orderBy(desc(s.sogpEnrollments.createdAt)).limit(1),
  ]);
  if (!recipient || !owner || recipient.userId === input.ownerUserId) return false;
  const groups = await ensureDiscipleshipGroups(owner);
  const group = groups.find(row => row.isDefault && row.status === "active");
  if (!group) return false;

  // Already in this group (they may be in others too: multi-group membership).
  const [member] = await db.select({ groupId: s.discipleshipMemberships.groupId })
    .from(s.discipleshipMemberships)
    .where(and(eq(s.discipleshipMemberships.memberUserId, recipient.userId), eq(s.discipleshipMemberships.groupId, group.id), eq(s.discipleshipMemberships.status, "active")))
    .limit(1);
  if (member) return false;

  // A follow-up invitation from an earlier owner is superseded by this one.
  await db.update(s.discipleshipGroupInvitations)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(and(
      eq(s.discipleshipGroupInvitations.recipientUserId, recipient.userId),
      eq(s.discipleshipGroupInvitations.origin, "referral"),
      eq(s.discipleshipGroupInvitations.status, "pending"),
      ne(s.discipleshipGroupInvitations.groupId, group.id),
    ));
  const created = await db.insert(s.discipleshipGroupInvitations)
    .values({ groupId: group.id, recipientEnrollmentId: recipient.id, invitedBy: input.invitedBy ?? input.ownerUserId, origin: "referral" })
    .onConflictDoNothing()
    .returning({ id: s.discipleshipGroupInvitations.id });
  if (created[0]) await notifyGroupInvitation({ invitationId: created[0].id }).catch(error => console.error("group invitation notification failed", error));
  return created.length > 0;
}

/**
 * The assignment is already saved; a failed invitation is logged and never
 * reported as a failed assignment.
 */
export async function inviteIntoOwnersGroups(enrollmentIds: number[], ownerUserId: string, invitedBy?: string | null) {
  let sent = 0;
  for (const enrollmentId of enrollmentIds) {
    try { if (await inviteIntoOwnersGroup({ enrollmentId, ownerUserId, invitedBy })) sent += 1; }
    catch (error) { console.error("follow-up group invitation failed", error); }
  }
  return sent;
}
