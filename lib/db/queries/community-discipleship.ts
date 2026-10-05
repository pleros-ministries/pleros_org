import { cache } from "react";
import { and, asc, count, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
import type { DiscipleshipAccess } from "@/lib/community/discipleship-access";
import {
  evaluateCanMessage,
  isMinor,
  type MessagingRelation,
} from "@/lib/community/messaging";
import { firstNameOf, joinMonthLabel } from "@/lib/community/visibility";
import { DISCIPLESHIP_GROUP_MAX } from "@/lib/sogp/discipleship";

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

export type CommunityDiscipleship = {
  /** The group the viewer belongs to as a disciple. */
  joined: {
    groupId: number;
    groupName: string;
    joinedMonth: string;
    discipler: { firstName: string; messageUserId: string | null };
    fellowDisciples: DiscipleshipPeer[];
  } | null;
  /** The group the viewer leads; null until it has been created. */
  leading: {
    groupId: number;
    groupName: string;
    paused: boolean;
    capacity: number;
    disciples: DiscipleshipPeer[];
  } | null;
};

const leaderEnrollment = alias(schema.sogpEnrollments, "leader_enrollment");

/** The viewer's active membership in someone else's group, with its discipler. */
async function findJoinedGroup(userId: string) {
  const [row] = await db
    .select({
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      joinedAt: schema.discipleshipMemberships.joinedAt,
      leaderUserId: leaderEnrollment.userId,
      leaderName: leaderEnrollment.name,
      leaderFirstName: leaderEnrollment.firstName,
      leaderBirthYear: leaderEnrollment.birthYear,
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
        ne(schema.discipleshipGroups.status, "archived"),
      ),
    )
    .orderBy(desc(schema.discipleshipMemberships.joinedAt))
    .limit(1);
  return row ?? null;
}

/** The group the viewer leads, resolved from their newest enrolment like the discipleship page. */
async function findLedGroup(userId: string) {
  const [row] = await db
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
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);
  return row ?? null;
}

async function listActiveDisciples(groupId: number) {
  return db
    .select({
      userId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
      birthYear: schema.sogpEnrollments.birthYear,
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

const NO_LINK: MessagingRelation = {
  blockedEitherWay: false,
  senderGuidesRecipient: false,
  recipientGuidesSender: false,
};

/**
 * Whether to offer a Message button, using the same rule as sending. Blocks
 * and unit-leader links are not known here, so the server action still has
 * the final say when the conversation is opened.
 */
function messageIdFor(
  viewer: CommunityContext,
  other: { userId: string; birthYear: number | null },
  relation: MessagingRelation,
): string | null {
  const decision = evaluateCanMessage(
    {
      userId: viewer.userId,
      inCommunity: true,
      isAdmin: viewer.isAdmin,
      isMinor: viewer.isMinor,
      messagingBlocked: viewer.messagingBlocked,
    },
    {
      userId: other.userId,
      inCommunity: true,
      isAdmin: false,
      isMinor: isMinor(other.birthYear),
      messagingBlocked: false,
    },
    relation,
  );
  return decision.ok ? other.userId : null;
}

export async function getCommunityDiscipleship(
  viewer: CommunityContext,
): Promise<CommunityDiscipleship> {
  const [joinedRow, ledRow] = await Promise.all([
    findJoinedGroup(viewer.userId),
    findLedGroup(viewer.userId),
  ]);
  const [fellowRows, discipleRows] = await Promise.all([
    joinedRow ? listActiveDisciples(joinedRow.groupId) : Promise.resolve([]),
    ledRow ? listActiveDisciples(ledRow.id) : Promise.resolve([]),
  ]);

  const toPeer = (
    row: (typeof discipleRows)[number],
    relation: MessagingRelation,
  ): DiscipleshipPeer => ({
    firstName: firstNameOf(row.firstName || row.name),
    joinedMonth: joinMonthLabel(row.joinedAt),
    messageUserId: messageIdFor(viewer, row, relation),
  });

  return {
    joined: joinedRow
      ? {
          groupId: joinedRow.groupId,
          groupName: joinedRow.groupName,
          joinedMonth: joinMonthLabel(joinedRow.joinedAt),
          discipler: {
            firstName: firstNameOf(
              joinedRow.leaderFirstName || joinedRow.leaderName,
            ),
            messageUserId: messageIdFor(
              viewer,
              {
                userId: joinedRow.leaderUserId,
                birthYear: joinedRow.leaderBirthYear,
              },
              { ...NO_LINK, recipientGuidesSender: true },
            ),
          },
          fellowDisciples: fellowRows
            .filter((row) => row.userId !== viewer.userId)
            .map((row) => toPeer(row, NO_LINK)),
        }
      : null,
    leading: ledRow
      ? {
          groupId: ledRow.id,
          groupName: ledRow.name,
          paused: ledRow.status === "archived",
          capacity: DISCIPLESHIP_GROUP_MAX,
          disciples: discipleRows.map((row) =>
            toPeer(row, { ...NO_LINK, senderGuidesRecipient: true }),
          ),
        }
      : null,
  };
}

export type DiscipleshipRailSummary = {
  disciplerFirstName: string | null;
  discipleCount: number;
};

/** Compact "Your discipleship group" payload for the community left rail. */
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
          ne(schema.discipleshipGroups.status, "archived"),
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
