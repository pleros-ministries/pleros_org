import "server-only";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { discipleshipJoinBlockMessage } from "@/lib/sogp/discipleship";
import { fuzzyNameScore } from "@/lib/community/fuzzy-name";
import { fullNameOf } from "@/lib/community/visibility";
import { nameSearch } from "@/lib/db/name-search";
import { notifyGroupInvitation } from "@/lib/community/notify";
import {
  DiscipleshipError,
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
  if (created) {
    // The invitation is saved; a failed notification never fails the invite.
    await notifyGroupInvitation({ invitationId: created.id }).catch(error => console.error("group invitation notification failed", error));
    return created;
  }
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
  /** The recipient's own current group, so accepting can say it moves them (one overseer). */
  currentGroup: { id: number; name: string; leaderName: string } | null;
};
/** Sender view: the recipient's name only; email/phone stay out of the payload. */
export type SentInvitation = {
  id: number; status: InvitationStatus; createdAt: string; respondedAt: string | null;
  groupId: number; groupName: string; leaderName: string; recipientName: string;
};

const iso = (value: Date | string | null) => (value ? new Date(value).toISOString() : null);

function received(row: InvitationRow, current: ReceivedInvitation["currentGroup"] = null): ReceivedInvitation {
  return {
    id: row.id, status: row.status, origin: row.origin, createdAt: iso(row.createdAt)!,
    groupName: row.groupName, leaderName: row.leaderName, groupAvailable: row.groupStatus === "active",
    currentGroup: current && current.id !== row.groupId ? current : null,
  };
}

/** The group a person is in now, with its leader's name: theirs to see on their own invitations. */
async function loadCurrentGroup(userId: string): Promise<ReceivedInvitation["currentGroup"]> {
  const [row] = await db
    .select({ id: schema.discipleshipGroups.id, name: schema.discipleshipGroups.name, leaderName: schema.users.name })
    .from(schema.discipleshipMemberships)
    .innerJoin(schema.discipleshipGroups, eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId))
    .innerJoin(schema.users, eq(schema.users.id, schema.discipleshipGroups.leaderUserId))
    .where(and(eq(schema.discipleshipMemberships.memberUserId, userId), eq(schema.discipleshipMemberships.status, "active")))
    .limit(1);
  return row ?? null;
}
function sent(row: InvitationRow): SentInvitation {
  return {
    id: row.id, status: row.status, createdAt: iso(row.createdAt)!, respondedAt: iso(row.respondedAt),
    groupId: row.groupId, groupName: row.groupName, leaderName: row.leaderName, recipientName: row.recipientName,
  };
}

export async function listOwnPendingInvitations(userId: string): Promise<ReceivedInvitation[]> {
  const [rows, current] = await Promise.all([
    invitationQuery()
      .where(and(eq(recipientEnrollment.userId, userId), eq(schema.discipleshipGroupInvitations.status, "pending")))
      .orderBy(desc(schema.discipleshipGroupInvitations.createdAt))
      .limit(20),
    loadCurrentGroup(userId),
  ]);
  return rows.map(row => received(row, current));
}

export async function getOwnInvitation(userId: string, invitationId: number): Promise<ReceivedInvitation | null> {
  const [[row], current] = await Promise.all([
    invitationQuery().where(eq(schema.discipleshipGroupInvitations.id, invitationId)).limit(1),
    loadCurrentGroup(userId),
  ]);
  return row && row.recipientUserId === userId ? received(row, current) : null;
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
  /** Confirmed leaving their current group (the invitation page warns first). */
  move?: boolean;
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
          moveFromCurrent: input.move === true,
        });
        if (!decision.ok) return { ok: false as const, error: decision.reason === "already_in_group" ? "You're in another group. Confirm the move to join this one." : discipleshipJoinBlockMessage(decision.reason) };
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

export type InviteCandidate = { enrollmentId: number; name: string; state: "free" | "in_a_group" | "in_this_group" | "invited" };

/**
 * Leaders add people to a group by name (groups as oversight, 19 October).
 * Full names, as the new-message picker shows them; whose group someone is in
 * stays private ("In a group").
 */
export async function searchGroupInvitees(input: { leaderUserId: string; leaderEnrollmentId: number; groupId: number; term: string }): Promise<InviteCandidate[]> {
  const group = await requireActiveLedGroup(input.leaderEnrollmentId, input.groupId);
  const term = input.term.trim().slice(0, 60);
  if (term.length < 2) return [];
  const search = nameSearch(term, sql`concat_ws(' ', ${schema.sogpEnrollments.firstName}, ${schema.sogpEnrollments.name})`);
  if (!search) return [];
  const rows = await db
    .select({ enrollmentId: schema.sogpEnrollments.id, userId: schema.sogpEnrollments.userId, name: schema.sogpEnrollments.name, firstName: schema.sogpEnrollments.firstName })
    .from(schema.sogpEnrollments)
    .where(and(
      search.loose,
      ne(schema.sogpEnrollments.userId, input.leaderUserId),
      ne(schema.sogpEnrollments.status, "withdrawn"),
    ))
    .orderBy(search.rank, asc(schema.sogpEnrollments.name), desc(schema.sogpEnrollments.createdAt))
    .limit(300);
  // One row per person, their latest enrolment.
  const best = new Map<string, { enrollmentId: number; userId: string; name: string; score: number }>();
  for (const row of rows) {
    const name = fullNameOf(row.name || row.firstName || "");
    const score = Math.max(fuzzyNameScore(term, name), fuzzyNameScore(term, row.firstName ?? ""));
    if (!score || best.has(row.userId)) continue;
    best.set(row.userId, { enrollmentId: row.enrollmentId, userId: row.userId, name, score });
  }
  const top = [...best.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, 15);
  if (!top.length) return [];
  const ids = top.map(row => row.userId);
  const [memberships, pending] = await Promise.all([
    db.select({ userId: schema.discipleshipMemberships.memberUserId, groupId: schema.discipleshipMemberships.groupId })
      .from(schema.discipleshipMemberships)
      .where(and(inArray(schema.discipleshipMemberships.memberUserId, ids), eq(schema.discipleshipMemberships.status, "active"))),
    db.select({ userId: schema.discipleshipGroupInvitations.recipientUserId })
      .from(schema.discipleshipGroupInvitations)
      .where(and(eq(schema.discipleshipGroupInvitations.groupId, group.id), eq(schema.discipleshipGroupInvitations.status, "pending"), inArray(schema.discipleshipGroupInvitations.recipientUserId, ids))),
  ]);
  const groupOf = new Map(memberships.flatMap(row => row.userId ? [[row.userId, row.groupId] as const] : []));
  const invited = new Set(pending.map(row => row.userId));
  return top.map(row => ({
    enrollmentId: row.enrollmentId,
    name: row.name,
    state: groupOf.get(row.userId) === group.id ? "in_this_group" : invited.has(row.userId) ? "invited" : groupOf.has(row.userId) ? "in_a_group" : "free",
  }));
}

export type PendingGroupInvitation = { id: number; name: string; createdAt: string };

/**
 * Invites sent by name to one group and not yet answered, newest first (user,
 * 22 October: leaders need to see who hasn't joined). Bounded to the group's
 * own leader; names only.
 */
export async function listPendingGroupInvitations(leaderUserId: string, groupId: number): Promise<PendingGroupInvitation[]> {
  const rows = await invitationQuery()
    .where(and(
      eq(schema.discipleshipGroupInvitations.groupId, groupId),
      eq(schema.discipleshipGroups.leaderUserId, leaderUserId),
      eq(schema.discipleshipGroupInvitations.status, "pending"),
    ))
    .orderBy(desc(schema.discipleshipGroupInvitations.createdAt))
    .limit(100);
  return rows.map(row => ({ id: row.id, name: row.recipientName, createdAt: iso(row.createdAt)! }));
}
