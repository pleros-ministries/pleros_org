import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { churchBranchIds } from "@/lib/church/permissions";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import type { Tx } from "./outreach-contacts";
import { decideOversight, OVERSIGHT_MAX_DEPTH, wouldCreateLoop, type OversightViewer } from "@/lib/oversight/tree";

/**
 * Groups as oversight (Pastor, 19 October; migration 0069): the leader of the
 * group you are in is your overseer. A membership counts while it is active
 * and its group is not closed; an admin pause keeps the line of oversight.
 */

type Executor = typeof db | Tx;


/** Serialises every change to who oversees whom, so two joins cannot build a loop between them. */
export async function lockOversightTree(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:oversight-tree', 0))`);
}

/** The person's overseers, nearest first. */
export async function loadOverseerChain(executor: Executor, userId: string): Promise<string[]> {
  const result = await executor.execute<{ overseer: string; depth: number }>(sql`
    with recursive chain(member, overseer, depth, path) as (
      select m.member_user_id, g.leader_user_id, 1, array[m.member_user_id, g.leader_user_id]
      from discipleship_memberships m
      join discipleship_groups g on g.id = m.group_id
      where m.member_user_id = ${userId} and m.status = 'active' and g.status <> 'closed'
      union all
      select m.member_user_id, g.leader_user_id, c.depth + 1, c.path || g.leader_user_id
      from chain c
      join discipleship_memberships m on m.member_user_id = c.overseer and m.status = 'active'
      join discipleship_groups g on g.id = m.group_id and g.status <> 'closed'
      where c.depth < ${OVERSIGHT_MAX_DEPTH} and not g.leader_user_id = any(c.path)
    )
    select overseer, depth from chain order by depth`);
  return result.rows.map(row => row.overseer);
}

/**
 * Refuses a join that would make someone their own overseer at any depth.
 * Call inside the joining transaction, after `lockOversightTree`.
 */
export async function assertNoOversightLoop(tx: Tx, input: { joinerUserId: string; leaderUserId: string }) {
  const chain = await loadOverseerChain(tx, input.leaderUserId);
  if (wouldCreateLoop(chain, input.joinerUserId, input.leaderUserId)) {
    throw new CommunityError(input.joinerUserId === input.leaderUserId
      ? "You can't join a group you lead."
      : "This person already oversees the group's leader, so they can't join it.");
  }
}

/** Every branch a person is placed in, through any of their enrolments or their church membership. */
async function loadBranchPlacements(userId: string): Promise<number[]> {
  const [viaEnrolment, viaMembership] = await Promise.all([
    db.select({ branchId: s.sogpEnrollmentBranches.branchId })
      .from(s.sogpEnrollmentBranches)
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.sogpEnrollmentBranches.enrollmentId))
      .where(eq(s.sogpEnrollments.userId, userId)),
    db.select({ branchId: s.churchBranchMemberships.branchId })
      .from(s.churchBranchMemberships)
      .where(eq(s.churchBranchMemberships.userId, userId)),
  ]);
  return [...new Set([...viaEnrolment, ...viaMembership].map(row => row.branchId))];
}

async function loadViewer(userId: string): Promise<OversightViewer> {
  const [[user], church] = await Promise.all([
    db.select({ role: s.users.role }).from(s.users).where(eq(s.users.id, userId)).limit(1),
    getChurchAssignment(userId),
  ]);
  return {
    userId,
    isAdmin: user?.role === "admin" || user?.role === "super_admin",
    isPastor: church?.role === "pastor",
    // Branch pastor status survives the retired org chart (user decision, 19 October).
    branchIds: church?.role === "branch_pastor" ? churchBranchIds(church) : [],
  };
}

/**
 * Whether the viewer may see the subject's full daily report and status
 * (user decision, 19 October). Replaces `canReadChurchReport` once the
 * report pages move onto groups.
 */
export async function canOversee(viewerId: string, subjectId: string): Promise<boolean> {
  if (!viewerId || !subjectId || viewerId === subjectId) return false;
  const viewer = await loadViewer(viewerId);
  if (viewer.isAdmin || viewer.isPastor) return true;
  const [chain, branches] = await Promise.all([
    loadOverseerChain(db, subjectId),
    viewer.branchIds.length ? loadBranchPlacements(subjectId) : Promise.resolve([]),
  ]);
  return decideOversight({ viewer, subjectId, subjectAncestors: chain, subjectBranchIds: branches });
}

/** Throws unless the viewer oversees the subject. */
export async function requireOversight(viewerId: string, subjectId: string) {
  if (!(await canOversee(viewerId, subjectId))) throw new CommunityError("You can only see reports for people in your groups.");
}

/** Whether the person leads at least one group with an active member (Oversight shows for them). */
export async function leadsAnyMembers(userId: string): Promise<boolean> {
  const [row] = await db.select({ id: s.discipleshipMemberships.id })
    .from(s.discipleshipMemberships)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
    .where(and(eq(s.discipleshipGroups.leaderUserId, userId), eq(s.discipleshipMemberships.status, "active"), inArray(s.discipleshipGroups.status, ["active", "archived"])))
    .limit(1);
  return Boolean(row);
}

/** Report access: the person's overseers up the tree, the Pastor, their branch pastor and admins. */
export async function requireReportAccess(viewerId: string, subjectId: string) {
  await requireOversight(viewerId, subjectId);
}

/** Someone under a focus person: who oversees them, through which group, and how far down. */
export type TreeEdge = { userId: string; overseerId: string; groupId: number; depth: number };

/** Everyone under the focus person, to any depth, nearest first. */
export async function listDescendants(focusUserId: string): Promise<TreeEdge[]> {
  const result = await db.execute<{ member: string; overseer: string; group_id: number; depth: number }>(sql`
    with recursive tree(member, overseer, group_id, depth, path) as (
      select m.member_user_id, g.leader_user_id, g.id, 1, array[g.leader_user_id, m.member_user_id]
      from discipleship_groups g
      join discipleship_memberships m on m.group_id = g.id and m.status = 'active'
      where g.leader_user_id = ${focusUserId} and g.status <> 'closed'
      union all
      select m.member_user_id, g.leader_user_id, g.id, t.depth + 1, t.path || m.member_user_id
      from tree t
      join discipleship_groups g on g.leader_user_id = t.member and g.status <> 'closed'
      join discipleship_memberships m on m.group_id = g.id and m.status = 'active'
      where t.depth < ${OVERSIGHT_MAX_DEPTH} and not m.member_user_id = any(t.path)
    )
    select member, overseer, group_id, depth from tree order by depth`);
  return result.rows.map(row => ({ userId: row.member, overseerId: row.overseer, groupId: Number(row.group_id), depth: Number(row.depth) }));
}

/**
 * Everyone the group model expects a report from: members of an open group,
 * and leaders who have members. Edges for members; leaders at the top of a
 * tree have no overseer.
 */
export async function listGroupPeople(): Promise<{ edges: TreeEdge[]; roots: string[] }> {
  const rows = await db.select({ userId: s.discipleshipMemberships.memberUserId, overseerId: s.discipleshipGroups.leaderUserId, groupId: s.discipleshipGroups.id })
    .from(s.discipleshipMemberships)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
    .where(and(eq(s.discipleshipMemberships.status, "active"), inArray(s.discipleshipGroups.status, ["active", "archived"])));
  const edges = rows.flatMap(row => row.userId && row.overseerId ? [{ userId: row.userId, overseerId: row.overseerId, groupId: row.groupId, depth: 0 }] : []);
  const members = new Set(edges.map(edge => edge.userId));
  return { edges, roots: [...new Set(edges.map(edge => edge.overseerId))].filter(id => !members.has(id)) };
}

/** Whether a report is expected from this person under the group model. */
export async function isGroupPerson(executor: Executor, userId: string): Promise<boolean> {
  const [row] = await executor.select({ id: s.discipleshipMemberships.id })
    .from(s.discipleshipMemberships)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
    .where(and(
      eq(s.discipleshipMemberships.status, "active"),
      inArray(s.discipleshipGroups.status, ["active", "archived"]),
      sql`(${s.discipleshipMemberships.memberUserId} = ${userId} or ${s.discipleshipGroups.leaderUserId} = ${userId})`,
    ))
    .limit(1);
  return Boolean(row);
}
