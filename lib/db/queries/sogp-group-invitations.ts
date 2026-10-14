import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { discipleshipJoinBlockMessage } from "@/lib/sogp/discipleship";
import {
  DiscipleshipError,
  ensureDiscipleshipGroups,
  joinGroupInTransaction,
  requireActiveLedGroup,
} from "./sogp-discipleship";

/**
 * In-app discipleship group invitations. An invitation grants nothing: the
 * recipient joins only by accepting, through the same locked join rules as an
 * invite link (one active discipler, cap, no circular or own-group joins).
 * Follow-up ownership, church appointments and saved contacts are separate.
 */

export type InvitationStatus = "pending" | "accepted" | "declined" | "withdrawn";

const recipientEnrollment = alias(schema.sogpEnrollments, "recipient_enrollment");
const leaderEnrollment = alias(schema.sogpEnrollments, "leader_enrollment");


/**
 * After a referral, invites the new learner to the referrer's oldest active
 * group (creating the referrer's first group if they have none, as their
 * first dashboard visit would). Idempotent; never creates membership.
 */
export async function inviteReferredLearnerToOwnerGroup(input: {
  referrerEnrollmentId: number;
  referrerUserId: string;
  recipientEnrollmentId: number;
  /** Code of the group invite link the learner arrived through, if any. */
  groupInviteCode?: string | null;
}): Promise<void> {
  const [referrer] = await db
    .select({ id: schema.sogpEnrollments.id, firstName: schema.sogpEnrollments.firstName, name: schema.users.name })
    .from(schema.sogpEnrollments)
    .innerJoin(schema.users, eq(schema.users.id, schema.sogpEnrollments.userId))
    .where(eq(schema.sogpEnrollments.id, input.referrerEnrollmentId))
    .limit(1);
  if (!referrer) return;
  const groups = await ensureDiscipleshipGroups({ id: referrer.id, firstName: referrer.firstName, name: referrer.name });
  // A group invite link names its group; a plain referral uses the oldest.
  const group = groups.find(row => row.status === "active" && input.groupInviteCode != null && row.inviteCode === input.groupInviteCode)
    ?? groups.find(row => row.status === "active");
  if (!group) return;
  await db
    .insert(schema.discipleshipGroupInvitations)
    .values({ groupId: group.id, recipientEnrollmentId: input.recipientEnrollmentId, invitedBy: input.referrerUserId, origin: "referral" })
    .onConflictDoNothing();
}

/** Leader sends an in-app invitation to an existing enrolled account they selected. */
export async function sendInAppInvitation(input: {
  leaderUserId: string;
  leaderEnrollmentId: number;
  groupId: number;
  recipientEnrollmentId: number;
}): Promise<{ id: number }> {
  const group = await requireActiveLedGroup(input.leaderEnrollmentId, input.groupId);
  if (input.recipientEnrollmentId === input.leaderEnrollmentId) {
    throw new DiscipleshipError(discipleshipJoinBlockMessage("own_group"));
  }
  const [recipient] = await db
    .select({ id: schema.sogpEnrollments.id, userId: schema.sogpEnrollments.userId })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.id, input.recipientEnrollmentId))
    .limit(1);
  if (!recipient || recipient.userId === input.leaderUserId) throw new DiscipleshipError("Choose someone else to invite.");
  const [created] = await db
    .insert(schema.discipleshipGroupInvitations)
    .values({ groupId: group.id, recipientEnrollmentId: recipient.id, invitedBy: input.leaderUserId, origin: "in_app" })
    .onConflictDoNothing()
    .returning({ id: schema.discipleshipGroupInvitations.id });
  if (created) return created;
  const [existing] = await db
    .select({ id: schema.discipleshipGroupInvitations.id })
    .from(schema.discipleshipGroupInvitations)
    .where(and(
      eq(schema.discipleshipGroupInvitations.groupId, group.id),
      eq(schema.discipleshipGroupInvitations.recipientEnrollmentId, recipient.id),
      eq(schema.discipleshipGroupInvitations.status, "pending"),
    ))
    .limit(1);
  if (!existing) throw new DiscipleshipError("The invitation could not be sent. Try again.");
  return existing;
}

const invitationColumns = {
  id: schema.discipleshipGroupInvitations.id,
  status: schema.discipleshipGroupInvitations.status,
  origin: schema.discipleshipGroupInvitations.origin,
  createdAt: schema.discipleshipGroupInvitations.createdAt,
  respondedAt: schema.discipleshipGroupInvitations.respondedAt,
  groupId: schema.discipleshipGroups.id,
  groupName: schema.discipleshipGroups.name,
  groupStatus: schema.discipleshipGroups.status,
  leaderEnrollmentId: schema.discipleshipGroups.leaderEnrollmentId,
  leaderName: schema.users.name,
  recipientEnrollmentId: schema.discipleshipGroupInvitations.recipientEnrollmentId,
  recipientUserId: recipientEnrollment.userId,
  recipientName: recipientEnrollment.name,
};

function invitationQuery() {
  return db
    .select(invitationColumns)
    .from(schema.discipleshipGroupInvitations)
    .innerJoin(schema.discipleshipGroups, eq(schema.discipleshipGroups.id, schema.discipleshipGroupInvitations.groupId))
    .innerJoin(leaderEnrollment, eq(leaderEnrollment.id, schema.discipleshipGroups.leaderEnrollmentId))
    .innerJoin(schema.users, eq(schema.users.id, leaderEnrollment.userId))
    .innerJoin(recipientEnrollment, eq(recipientEnrollment.id, schema.discipleshipGroupInvitations.recipientEnrollmentId));
}

type InvitationRow = Awaited<ReturnType<typeof invitationQuery>>[number];

/** Recipient view: leader name and group only. No contact details travel either way. */
export type ReceivedInvitation = {
  id: number; status: InvitationStatus; origin: "referral" | "in_app"; createdAt: string;
  groupName: string; leaderName: string; groupAvailable: boolean;
};
/** Sender view: the recipient's name only; email/phone stay out of the payload. */
export type SentInvitation = {
  id: number; status: InvitationStatus; createdAt: string; respondedAt: string | null;
  groupId: number; groupName: string; leaderName: string; recipientName: string;
};

const iso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);

function received(row: InvitationRow): ReceivedInvitation {
  return {
    id: row.id, status: row.status, origin: row.origin, createdAt: iso(row.createdAt)!,
    groupName: row.groupName, leaderName: row.leaderName, groupAvailable: row.groupStatus === "active",
  };
}
function sent(row: InvitationRow): SentInvitation {
  return {
    id: row.id, status: row.status, createdAt: iso(row.createdAt)!, respondedAt: iso(row.respondedAt),
    groupId: row.groupId, groupName: row.groupName, leaderName: row.leaderName, recipientName: row.recipientName,
  };
}

async function ownEnrollmentIds(userId: string) {
  const rows = await db.select({ id: schema.sogpEnrollments.id }).from(schema.sogpEnrollments).where(eq(schema.sogpEnrollments.userId, userId));
  return rows.map(row => row.id);
}

export async function listOwnPendingInvitations(userId: string): Promise<ReceivedInvitation[]> {
  const ids = await ownEnrollmentIds(userId);
  if (!ids.length) return [];
  const rows = await invitationQuery()
    .where(and(inArray(schema.discipleshipGroupInvitations.recipientEnrollmentId, ids), eq(schema.discipleshipGroupInvitations.status, "pending")))
    .orderBy(desc(schema.discipleshipGroupInvitations.createdAt))
    .limit(20);
  return rows.map(received);
}

export async function getOwnInvitation(userId: string, invitationId: number): Promise<ReceivedInvitation | null> {
  const [row] = await invitationQuery().where(eq(schema.discipleshipGroupInvitations.id, invitationId)).limit(1);
  return row && row.recipientUserId === userId ? received(row) : null;
}

/** Invitations the leader sent, newest first; bounded to their own groups. */
export async function listSentInvitations(leaderEnrollmentId: number): Promise<SentInvitation[]> {
  const rows = await invitationQuery()
    .where(eq(schema.discipleshipGroups.leaderEnrollmentId, leaderEnrollmentId))
    .orderBy(asc(schema.discipleshipGroupInvitations.status), desc(schema.discipleshipGroupInvitations.createdAt))
    .limit(100);
  return rows.map(sent);
}

export async function getSentInvitation(leaderEnrollmentId: number, invitationId: number): Promise<SentInvitation | null> {
  const [row] = await invitationQuery().where(eq(schema.discipleshipGroupInvitations.id, invitationId)).limit(1);
  return row && row.leaderEnrollmentId === leaderEnrollmentId ? sent(row) : null;
}

/** Recipient accepts or declines. Acceptance runs the locked join rules. */
export async function respondToInvitation(input: {
  userId: string;
  invitationId: number;
  accept: boolean;
  sharesPhone: boolean;
}): Promise<{ ok: true; status: "accepted" | "declined" } | { ok: false; error: string }> {
  try {
    return await transactionDb.transaction(async tx => {
      const [invitation] = await tx
        .select({
          id: schema.discipleshipGroupInvitations.id,
          status: schema.discipleshipGroupInvitations.status,
          groupId: schema.discipleshipGroupInvitations.groupId,
          recipientEnrollmentId: schema.discipleshipGroupInvitations.recipientEnrollmentId,
        })
        .from(schema.discipleshipGroupInvitations)
        .where(eq(schema.discipleshipGroupInvitations.id, input.invitationId))
        .for("update");
      if (!invitation) return { ok: false as const, error: "This invitation isn't available." };
      const [recipient] = await tx
        .select({ userId: schema.sogpEnrollments.userId })
        .from(schema.sogpEnrollments)
        .where(eq(schema.sogpEnrollments.id, invitation.recipientEnrollmentId))
        .limit(1);
      if (recipient?.userId !== input.userId) return { ok: false as const, error: "This invitation isn't available." };
      if (invitation.status !== "pending") return { ok: false as const, error: "You've already responded to this invitation." };
      if (input.accept) {
        const decision = await joinGroupInTransaction(tx, {
          groupId: invitation.groupId,
          viewerEnrollmentId: invitation.recipientEnrollmentId,
          sharesPhone: input.sharesPhone,
        });
        if (!decision.ok) return { ok: false as const, error: discipleshipJoinBlockMessage(decision.reason) };
      }
      const status = input.accept ? "accepted" as const : "declined" as const;
      await tx
        .update(schema.discipleshipGroupInvitations)
        .set({ status, respondedAt: new Date() })
        .where(eq(schema.discipleshipGroupInvitations.id, invitation.id));
      return { ok: true as const, status };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { ok: false, error: discipleshipJoinBlockMessage("already_in_group") };
    if (error instanceof DiscipleshipError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Leader withdraws a still-pending invitation from one of their groups. */
export async function withdrawInvitation(leaderEnrollmentId: number, invitationId: number): Promise<boolean> {
  const invitation = await getSentInvitation(leaderEnrollmentId, invitationId);
  if (!invitation || invitation.status !== "pending") return false;
  const updated = await db
    .update(schema.discipleshipGroupInvitations)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(and(eq(schema.discipleshipGroupInvitations.id, invitationId), eq(schema.discipleshipGroupInvitations.status, "pending")))
    .returning({ id: schema.discipleshipGroupInvitations.id });
  return updated.length > 0;
}

