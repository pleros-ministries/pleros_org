import { cache } from "react";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import type { CommunityContext } from "@/lib/community/context";
import { CommunityError } from "@/lib/community/errors";
import {
  GROUPS_OWNED_MAX,
  canManageGroupMember,
  canModerateGroup,
  canPostInGroup,
  canViewGroupContent,
  evaluateGroupJoin,
  isGroupMember,
  ownsGroup,
  type GroupAccess,
  type GroupInput,
  type GroupJoinDecision,
  type GroupMemberStatus,
  type GroupPrivacy,
  type GroupRole,
  type GroupStatus,
} from "@/lib/community/groups";
import { minorBirthYearFloor } from "@/lib/community/messaging";
import { firstNameOf, joinMonthLabel } from "@/lib/community/visibility";

/**
 * Member-created groups: any learner can start one, others join (public) or
 * ask to join (private), and its owner and moderators run it. Peers see first
 * names only, as everywhere in the community.
 */

const groups = schema.communityGroups;
const members = schema.communityGroupMembers;

const NAME_TAKEN = "A group with that name already exists. Try another name.";

/** Active members of the group in the current row. */
const memberCountSql = sql<number>`(
  select count(*) from ${members}
  where ${members.groupId} = ${groups.id}
    and ${members.status} = 'active'
)::int`;

function isUniqueViolation(error: unknown): boolean {
  const code =
    (error as { code?: string })?.code ??
    (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

// ─── Access ────────────────────────────────────────────────────────────────

async function loadGroupAccess(
  userId: string,
  groupId: number,
): Promise<GroupAccess | null> {
  const [row] = await db
    .select({
      privacy: groups.privacy,
      status: groups.status,
      role: members.role,
      memberStatus: members.status,
    })
    .from(groups)
    .leftJoin(
      members,
      and(eq(members.groupId, groups.id), eq(members.userId, userId)),
    )
    .where(eq(groups.id, groupId))
    .limit(1);
  if (!row) return null;

  return {
    groupId,
    privacy: row.privacy,
    status: row.status,
    membership:
      row.role && row.memberStatus
        ? { role: row.role, status: row.memberStatus }
        : null,
  };
}

/**
 * One viewer's standing in one group; null when the group does not exist.
 * Request-cached, so read it before a mutation rather than after.
 */
export const getGroupAccess = cache(loadGroupAccess);

// ─── Directory ─────────────────────────────────────────────────────────────

export type GroupSummary = {
  id: number;
  name: string;
  description: string;
  privacy: GroupPrivacy;
  memberCount: number;
  /** The viewer's membership, if they have one in any state. */
  viewerRole: GroupRole | null;
  viewerStatus: GroupMemberStatus | null;
};

/** Every open group, the viewer's own first, then the largest. */
export async function listGroupDirectory(
  userId: string,
): Promise<GroupSummary[]> {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      privacy: groups.privacy,
      memberCount: memberCountSql,
      viewerRole: members.role,
      viewerStatus: members.status,
    })
    .from(groups)
    .leftJoin(
      members,
      and(eq(members.groupId, groups.id), eq(members.userId, userId)),
    )
    .where(eq(groups.status, "active"))
    .orderBy(
      sql`case
        when ${members.status} = 'active' then 0
        when ${members.status} = 'pending' then 1
        else 2
      end`,
      desc(memberCountSql),
      asc(groups.name),
    )
    .limit(200);
  return rows;
}

export type AdminGroupRow = {
  id: number;
  name: string;
  privacy: GroupPrivacy;
  status: GroupStatus;
  memberCount: number;
  ownerName: string | null;
  createdAt: string;
};

/** Every member-created group, open or archived — admin-only (full owner name). */
export async function listGroupsForAdmin(): Promise<AdminGroupRow[]> {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      privacy: groups.privacy,
      status: groups.status,
      memberCount: memberCountSql,
      ownerName: schema.users.name,
      createdAt: groups.createdAt,
    })
    .from(groups)
    .leftJoin(schema.users, eq(schema.users.id, groups.createdBy))
    .orderBy(desc(groups.createdAt))
    .limit(500);
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

// ─── One group ─────────────────────────────────────────────────────────────

export type GroupMemberView = {
  memberId: number;
  firstName: string;
  role: GroupRole;
  joinedMonth: string;
  isYou: boolean;
  /** Present only when the viewer may privately message this person. */
  messageUserId: string | null;
  /** The viewer may remove this member or change their role. */
  manageable: boolean;
};

export type GroupJoinRequestView = {
  memberId: number;
  firstName: string;
  requestedAt: string;
};

export type GroupDetail = {
  id: number;
  name: string;
  description: string;
  privacy: GroupPrivacy;
  status: GroupStatus;
  memberCount: number;
  createdMonth: string;
  viewer: {
    isMember: boolean;
    isOwner: boolean;
    canView: boolean;
    canPost: boolean;
    canManage: boolean;
    join: GroupJoinDecision;
  };
  /** Empty when the viewer cannot see inside the group. */
  members: GroupMemberView[];
  /** Requests to join, for the group's managers only. */
  requests: GroupJoinRequestView[];
};

export async function getGroupDetail(
  groupId: number,
  viewer: CommunityContext,
): Promise<GroupDetail | null> {
  const [[group], access] = await Promise.all([
    db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        privacy: groups.privacy,
        status: groups.status,
        createdAt: groups.createdAt,
        memberCount: memberCountSql,
      })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1),
    getGroupAccess(viewer.userId, groupId),
  ]);
  if (!group || !access) return null;

  const canView = canViewGroupContent(access, viewer.isAdmin);
  const canManage = canModerateGroup(access, viewer.isAdmin);
  const viewerRole =
    access.membership?.status === "active" ? access.membership.role : null;

  const rows = canView
    ? await db
        .select({
          memberId: members.id,
          userId: members.userId,
          role: members.role,
          status: members.status,
          createdAt: members.createdAt,
          name: schema.users.name,
          // Server-side only: decides whether the member can be messaged.
          isMinor: sql<boolean>`exists (
            select 1 from ${schema.sogpEnrollments}
            where ${schema.sogpEnrollments.userId} = ${members.userId}
              and ${schema.sogpEnrollments.birthYear} >= ${minorBirthYearFloor()}
          )`,
        })
        .from(members)
        .innerJoin(schema.users, eq(schema.users.id, members.userId))
        .where(
          and(
            eq(members.groupId, groupId),
            inArray(
              members.status,
              canManage ? ["active", "pending"] : ["active"],
            ),
          ),
        )
        .orderBy(
          sql`case ${members.role}
            when 'owner' then 0
            when 'moderator' then 1
            else 2
          end`,
          asc(members.createdAt),
        )
    : [];

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    privacy: group.privacy,
    status: group.status,
    memberCount: group.memberCount,
    createdMonth: joinMonthLabel(group.createdAt),
    viewer: {
      isMember: isGroupMember(access),
      isOwner: ownsGroup(access),
      canView,
      canPost: canPostInGroup(access),
      canManage,
      join: evaluateGroupJoin(access),
    },
    members: rows
      .filter((row) => row.status === "active")
      .map((row) => {
        const isYou = row.userId === viewer.userId;
        return {
          memberId: row.memberId,
          firstName: firstNameOf(row.name),
          role: row.role,
          joinedMonth: joinMonthLabel(row.createdAt),
          isYou,
          messageUserId:
            !isYou &&
            !viewer.isMinor &&
            !viewer.messagingBlocked &&
            !row.isMinor
              ? row.userId
              : null,
          manageable:
            !isYou &&
            canManage &&
            canManageGroupMember(viewerRole, row.role, viewer.isAdmin),
        };
      }),
    requests: rows
      .filter((row) => row.status === "pending")
      .map((row) => ({
        memberId: row.memberId,
        firstName: firstNameOf(row.name),
        requestedAt: row.createdAt.toISOString(),
      })),
  };
}

export async function getGroupName(groupId: number): Promise<string | null> {
  const [row] = await db
    .select({ name: groups.name })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  return row?.name ?? null;
}

/** A membership row by its id — the handle manager actions work with. */
export async function getGroupMembership(memberId: number) {
  const [row] = await db
    .select({
      id: members.id,
      groupId: members.groupId,
      userId: members.userId,
      role: members.role,
      status: members.status,
    })
    .from(members)
    .where(eq(members.id, memberId))
    .limit(1);
  return row ?? null;
}

/** The owner and moderators of a group — notified of requests to join. */
export async function listGroupManagerUserIds(
  groupId: number,
): Promise<string[]> {
  const rows = await db
    .select({ userId: members.userId })
    .from(members)
    .where(
      and(
        eq(members.groupId, groupId),
        eq(members.status, "active"),
        inArray(members.role, ["owner", "moderator"]),
      ),
    );
  return rows.map((row) => row.userId);
}

// ─── Creating and editing ──────────────────────────────────────────────────

async function assertGroupNameFree(name: string, exceptGroupId?: number) {
  const [clash] = await db
    .select({ id: groups.id })
    .from(groups)
    .where(
      exceptGroupId != null
        ? and(
            sql`lower(${groups.name}) = lower(${name})`,
            ne(groups.id, exceptGroupId),
          )
        : sql`lower(${groups.name}) = lower(${name})`,
    )
    .limit(1);
  if (clash) throw new CommunityError(NAME_TAKEN);
}

/** Creates a group with its creator as owner, in one transaction. */
export async function createGroup(
  userId: string,
  input: GroupInput,
): Promise<{ id: number }> {
  const [{ owned }] = await db
    .select({ owned: sql<number>`count(*)::int` })
    .from(members)
    .innerJoin(groups, eq(groups.id, members.groupId))
    .where(
      and(
        eq(members.userId, userId),
        eq(members.role, "owner"),
        eq(members.status, "active"),
        eq(groups.status, "active"),
      ),
    );
  if (owned >= GROUPS_OWNED_MAX) {
    throw new CommunityError(
      `You can own up to ${GROUPS_OWNED_MAX} groups. Archive one to start another.`,
    );
  }
  await assertGroupNameFree(input.name);

  try {
    return await transactionDb.transaction(async (tx) => {
      const [group] = await tx
        .insert(groups)
        .values({ ...input, createdBy: userId })
        .returning({ id: groups.id });
      await tx
        .insert(members)
        .values({ groupId: group.id, userId, role: "owner", status: "active" });
      return { id: group.id };
    });
  } catch (error) {
    // Two people took the same name at once; the unique index decides.
    if (isUniqueViolation(error)) throw new CommunityError(NAME_TAKEN);
    throw error;
  }
}

export async function updateGroup(groupId: number, input: GroupInput) {
  await assertGroupNameFree(input.name, groupId);
  try {
    await db
      .update(groups)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(groups.id, groupId));
  } catch (error) {
    if (isUniqueViolation(error)) throw new CommunityError(NAME_TAKEN);
    throw error;
  }
}

export async function setGroupStatus(groupId: number, status: GroupStatus) {
  await db
    .update(groups)
    .set({ status, updatedAt: new Date() })
    .where(eq(groups.id, groupId));
}

// ─── Membership ────────────────────────────────────────────────────────────

/** Adds the viewer as a member (public group) or as a pending request (private). */
export async function addGroupMember(input: {
  groupId: number;
  userId: string;
  status: "active" | "pending";
}) {
  await db
    .insert(members)
    .values({ ...input, role: "member" })
    .onConflictDoNothing({ target: [members.groupId, members.userId] });
}

/** Leaves the group or withdraws a pending request. The owner's row is never removed here. */
export async function removeOwnMembership(groupId: number, userId: string) {
  await db
    .delete(members)
    .where(
      and(
        eq(members.groupId, groupId),
        eq(members.userId, userId),
        ne(members.role, "owner"),
        inArray(members.status, ["active", "pending"]),
      ),
    );
}

export async function approveGroupRequest(memberId: number) {
  await db
    .update(members)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(members.id, memberId), eq(members.status, "pending")));
}

/** Declines a request or removes a member; they are free to join again. */
export async function deleteGroupMembership(memberId: number) {
  await db
    .delete(members)
    .where(and(eq(members.id, memberId), ne(members.role, "owner")));
}

/** Removes a member and stops them rejoining. */
export async function banGroupMember(memberId: number) {
  await db
    .update(members)
    .set({ status: "banned", role: "member", updatedAt: new Date() })
    .where(and(eq(members.id, memberId), ne(members.role, "owner")));
}

export async function setGroupMemberRole(
  memberId: number,
  role: "moderator" | "member",
) {
  await db
    .update(members)
    .set({ role, updatedAt: new Date() })
    .where(
      and(
        eq(members.id, memberId),
        eq(members.status, "active"),
        ne(members.role, "owner"),
      ),
    );
}

/** Admits everyone waiting — used when a private group becomes public. */
export async function approveAllGroupRequests(groupId: number) {
  await db
    .update(members)
    .set({ status: "active", updatedAt: new Date() })
    .where(and(eq(members.groupId, groupId), eq(members.status, "pending")));
}
