import { cache } from "react";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
import type { DiscipleshipAccess } from "@/lib/community/discipleship-access";
import {
  evaluateCanMessage,
  type MessagingRelation,
} from "@/lib/community/messaging";
import { firstNameOf, joinMonthLabel } from "@/lib/community/visibility";
import { DISCIPLESHIP_GROUPS_JOINED_MAX } from "@/lib/sogp/discipleship";

/**
 * A learner's discipleship relationships as shown inside the community: who
 * disciples them, who shares that group, and who they disciple. Peer-safe by
 * construction — first name and join month only. Progress, check-ins and
 * prayer requests stay on `/dashboard/sogp/discipleship`.
 *
 * Read-only: unlike the discipleship page, this never creates a group.
 */

export type DiscipleshipPeer = {
  firstName: string;
  joinedMonth: string;
  /** Present only when the viewer may privately message this person. */
  messageUserId: string | null;
};

export type JoinedDiscipleshipGroup = {
  groupId: number;
  groupName: string;
  joinedMonth: string;
  discipler: { firstName: string; messageUserId: string | null };
  fellowDisciples: DiscipleshipPeer[];
};

export type CommunityDiscipleship = {
  /** Every group the viewer is in, oldest first (multi-group membership, 29 October: up to five). */
  joinedGroups: JoinedDiscipleshipGroup[];
  /**
   * The open groups the viewer leads, oldest first; empty until the first is
   * created. A group its leader has closed never appears.
   */
  leading: Array<{
    groupId: number;
    groupName: string;
    paused: boolean;
    disciples: DiscipleshipPeer[];
  }>;
};

const leaderEnrollment = alias(schema.sogpEnrollments, "leader_enrollment");

/** Every group the viewer is in, with its leader, oldest first (multi-group membership, 29 October). */
async function findJoinedGroups(userId: string) {
  return db
    .select({
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      joinedAt: schema.discipleshipMemberships.joinedAt,
      leaderUserId: leaderEnrollment.userId,
      leaderName: leaderEnrollment.name,
      leaderFirstName: leaderEnrollment.firstName,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.sogpEnrollments,
      eq(
        schema.sogpEnrollments.id,
        schema.discipleshipMemberships.discipleEnrollmentId,
      ),
    )
    .innerJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
    )
    .innerJoin(
      leaderEnrollment,
      eq(leaderEnrollment.id, schema.discipleshipGroups.leaderEnrollmentId),
    )
    .where(
      and(
        eq(schema.sogpEnrollments.userId, userId),
        eq(schema.discipleshipMemberships.status, "active"),
        eq(schema.discipleshipGroups.status, "active"),
      ),
    )
    .orderBy(asc(schema.discipleshipMemberships.joinedAt))
    .limit(DISCIPLESHIP_GROUPS_JOINED_MAX);
}

/** Their first group, for one-line summaries. */
async function findJoinedGroup(userId: string) {
  return (await findJoinedGroups(userId))[0] ?? null;
}

/** The open groups the viewer leads (active or paused), oldest first. */
async function listLedGroups(userId: string) {
  return db
    .select({
      id: schema.discipleshipGroups.id,
      name: schema.discipleshipGroups.name,
      status: schema.discipleshipGroups.status,
    })
    .from(schema.discipleshipGroups)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
    )
    .where(
      and(
        eq(schema.sogpEnrollments.userId, userId),
        ne(schema.discipleshipGroups.status, "closed"),
      ),
    )
    .orderBy(asc(schema.discipleshipGroups.createdAt), asc(schema.discipleshipGroups.id));
}

async function listActiveDisciples(groupId: number) {
  return db
    .select({
      userId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
      joinedAt: schema.discipleshipMemberships.joinedAt,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.sogpEnrollments,
      eq(
        schema.sogpEnrollments.id,
        schema.discipleshipMemberships.discipleEnrollmentId,
      ),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.groupId, groupId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .orderBy(asc(schema.discipleshipMemberships.joinedAt));
}

const NO_LINK: MessagingRelation = { blockedEitherWay: false };

/**
 * Whether to offer a Message button, using the same rule as sending. Blocks
 * are not known here, so the server action still has the final say when the
 * conversation is opened.
 */
function messageIdFor(
  viewer: CommunityContext,
  other: { userId: string },
  relation: MessagingRelation,
): string | null {
  const decision = evaluateCanMessage(
    {
      userId: viewer.userId,
      inCommunity: true,
      messagingBlocked: viewer.messagingBlocked,
    },
    {
      userId: other.userId,
      inCommunity: true,
      messagingBlocked: false,
    },
    relation,
  );
  return decision.ok ? other.userId : null;
}

export async function getCommunityDiscipleship(
  viewer: CommunityContext,
): Promise<CommunityDiscipleship> {
  const [joinedRows, ledRows] = await Promise.all([
    findJoinedGroups(viewer.userId),
    listLedGroups(viewer.userId),
  ]);
  // Bounded by the limits on groups one learner leads and is in.
  const [fellowRowsByGroup, discipleRowsByGroup] = await Promise.all([
    Promise.all(joinedRows.map((row) => listActiveDisciples(row.groupId))),
    Promise.all(ledRows.map((row) => listActiveDisciples(row.id))),
  ]);

  const toPeer = (
    row: Awaited<ReturnType<typeof listActiveDisciples>>[number],
    relation: MessagingRelation,
  ): DiscipleshipPeer => ({
    firstName: firstNameOf(row.firstName || row.name),
    joinedMonth: joinMonthLabel(row.joinedAt),
    messageUserId: messageIdFor(viewer, row, relation),
  });

  return {
    joinedGroups: joinedRows.map((joinedRow, index) => ({
      groupId: joinedRow.groupId,
      groupName: joinedRow.groupName,
      joinedMonth: joinMonthLabel(joinedRow.joinedAt),
      discipler: {
        firstName: firstNameOf(joinedRow.leaderFirstName || joinedRow.leaderName),
        messageUserId: messageIdFor(viewer, { userId: joinedRow.leaderUserId }, NO_LINK),
      },
      fellowDisciples: (fellowRowsByGroup[index] ?? [])
        .filter((row) => row.userId !== viewer.userId)
        .map((row) => toPeer(row, NO_LINK)),
    })),
    leading: ledRows.map((ledRow, index) => ({
      groupId: ledRow.id,
      groupName: ledRow.name,
      paused: ledRow.status === "archived",
      disciples: (discipleRowsByGroup[index] ?? []).map((row) =>
        toPeer(row, NO_LINK),
      ),
    })),
  };
}

export type CommunityHomeDiscipleship = {
  /** Every group the viewer is in, with each leader's first name (multi-group membership). */
  joinedGroups: Array<{ groupId: number; groupName: string; leaderFirstName: string }>;
  leading: Array<{ groupId: number; groupName: string; paused: boolean; discipleCount: number }>;
  discipleCount: number;
};

/**
 * Compact home projection. The Community landing page needs group labels and
 * a total only, so it must not load every disciple and fellow-disciple row.
 */
export async function getCommunityHomeDiscipleship(userId: string): Promise<CommunityHomeDiscipleship> {
  const [joinedRows, ledRows, countedRows] = await Promise.all([
    findJoinedGroups(userId),
    listLedGroups(userId),
    db
      .select({ groupId: schema.discipleshipGroups.id, n: count() })
      .from(schema.discipleshipMemberships)
      .innerJoin(schema.discipleshipGroups, eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId))
      .innerJoin(schema.sogpEnrollments, eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId))
      .where(and(
        eq(schema.sogpEnrollments.userId, userId),
        eq(schema.discipleshipMemberships.status, "active"),
        eq(schema.discipleshipGroups.status, "active"),
      ))
      .groupBy(schema.discipleshipGroups.id),
  ]);
  const countByGroup = new Map(countedRows.map(row => [row.groupId, row.n]));
  return {
    joinedGroups: joinedRows.map(row => ({ groupId: row.groupId, groupName: row.groupName, leaderFirstName: firstNameOf(row.leaderFirstName || row.leaderName) })),
    leading: ledRows.map(row => ({
      groupId: row.id,
      groupName: row.name,
      paused: row.status === "archived",
      discipleCount: countByGroup.get(row.id) ?? 0,
    })),
    discipleCount: countedRows.reduce((total, row) => total + row.n, 0),
  };
}

/** Small read-only home projection; never creates a group or exposes contact details. */
export async function getOwnDisciplerSummary(viewer: CommunityContext): Promise<{ firstName: string; canMessage: boolean } | null> {
  const row = await findJoinedGroup(viewer.userId);
  if (!row) return null;
  return {
    firstName: firstNameOf(row.leaderFirstName || row.leaderName),
    canMessage: messageIdFor(viewer, { userId: row.leaderUserId }, NO_LINK) !== null,
  };
}

export type DiscipleshipRailSummary = {
  disciplerFirstName: string | null;
  discipleCount: number;
};

/** Compact discipleship payload for the community left rail; disciples are summed across led groups. */
export async function getDiscipleshipRailSummary(
  userId: string,
): Promise<DiscipleshipRailSummary> {
  const [joinedRow, [counted]] = await Promise.all([
    findJoinedGroup(userId),
    db
      .select({ n: count() })
      .from(schema.discipleshipMemberships)
      .innerJoin(
        schema.discipleshipGroups,
        eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
      )
      .innerJoin(
        schema.sogpEnrollments,
        eq(
          schema.sogpEnrollments.id,
          schema.discipleshipGroups.leaderEnrollmentId,
        ),
      )
      .where(
        and(
          eq(schema.sogpEnrollments.userId, userId),
          eq(schema.discipleshipMemberships.status, "active"),
          eq(schema.discipleshipGroups.status, "active"),
        ),
      ),
  ]);

  return {
    disciplerFirstName: joinedRow
      ? firstNameOf(joinedRow.leaderFirstName || joinedRow.leaderName)
      : null,
    discipleCount: counted?.n ?? 0,
  };
}

// ─── Group discussion space ────────────────────────────────────────────────

async function loadDiscipleshipAccess(
  userId: string,
): Promise<DiscipleshipAccess> {
  const [led, joined] = await Promise.all([
    db
      .select({ id: schema.discipleshipGroups.id })
      .from(schema.discipleshipGroups)
      .innerJoin(
        schema.sogpEnrollments,
        eq(
          schema.sogpEnrollments.id,
          schema.discipleshipGroups.leaderEnrollmentId,
        ),
      )
      .where(
        and(
          eq(schema.sogpEnrollments.userId, userId),
          eq(schema.discipleshipGroups.status, "active"),
        ),
      ),
    db
      .select({ id: schema.discipleshipMemberships.groupId })
      .from(schema.discipleshipMemberships)
      .innerJoin(
        schema.sogpEnrollments,
        eq(
          schema.sogpEnrollments.id,
          schema.discipleshipMemberships.discipleEnrollmentId,
        ),
      )
      .innerJoin(
        schema.discipleshipGroups,
        eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
      )
      .where(
        and(
          eq(schema.sogpEnrollments.userId, userId),
          eq(schema.discipleshipMemberships.status, "active"),
          eq(schema.discipleshipGroups.status, "active"),
        ),
      ),
  ]);
  return {
    ledGroupIds: led.map((row) => row.id),
    joinedGroupIds: joined.map((row) => row.id),
  };
}

/**
 * The discipleship groups whose discussion space a user can see right now: an
 * active group they lead, or one they are a current disciple in. A paused
 * group, or one the learner has left, drops out. Request-cached.
 */
export const getDiscipleshipAccess = cache(loadDiscipleshipAccess);

/** The discipler and current disciples of a group — used to notify them of a new post. */
export async function listDiscipleshipGroupMembers(
  groupId: number,
): Promise<Array<{ userId: string; firstName: string }>> {
  const [leaders, disciples] = await Promise.all([
    db
      .select({
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        firstName: schema.sogpEnrollments.firstName,
      })
      .from(schema.discipleshipGroups)
      .innerJoin(
        schema.sogpEnrollments,
        eq(
          schema.sogpEnrollments.id,
          schema.discipleshipGroups.leaderEnrollmentId,
        ),
      )
      .where(eq(schema.discipleshipGroups.id, groupId)),
    listActiveDisciples(groupId),
  ]);
  return [...leaders, ...disciples].map((row) => ({
    userId: row.userId,
    firstName: firstNameOf(row.firstName || row.name),
  }));
}
