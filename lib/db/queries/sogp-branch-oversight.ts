import "server-only";

import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";

import { churchBranchIds } from "@/lib/church/permissions";
import { CommunityError } from "@/lib/community/errors";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { ensureDiscipleshipGroups } from "./sogp-discipleship";
import { getChurchAssignment } from "./church-organisation";

type ChurchAdminScope = { kind: "whole_church" } | { kind: "branches"; branchIds: number[] };

export async function getChurchAdminScope(userId: string): Promise<ChurchAdminScope | null> {
  const appointment = await getChurchAssignment(userId);
  if (appointment?.role === "pastor") return { kind: "whole_church" };
  if (appointment?.role === "branch_pastor") return { kind: "branches", branchIds: churchBranchIds(appointment) };
  return null;
}

function scopeIncludes(scope: ChurchAdminScope, branchId: number) {
  return scope.kind === "whole_church" || scope.branchIds.includes(branchId);
}

async function requireScope(userId: string) {
  const scope = await getChurchAdminScope(userId);
  if (!scope) throw new CommunityError("You cannot manage SOGP branch assignments.");
  return scope;
}

export async function listScopedSogpEnrollees(viewerId: string) {
  const scope = await requireScope(viewerId);
  const owner = s.users;
  return db.select({
    enrollmentId: s.sogpEnrollments.id,
    name: s.sogpEnrollments.name,
    email: s.sogpEnrollments.email,
    status: s.sogpEnrollments.status,
    cohortTitle: s.sogpCohorts.title,
    branchId: s.sogpEnrollmentBranches.branchId,
    branchName: s.churchBranches.name,
    disciplerUserId: s.pastorAssignments.pastorUserId,
    disciplerName: owner.name,
    groupId: s.pastorAssignments.discipleshipGroupId,
  }).from(s.sogpEnrollments)
    .innerJoin(s.sogpCohorts, eq(s.sogpCohorts.id, s.sogpEnrollments.cohortId))
    .leftJoin(s.sogpEnrollmentBranches, eq(s.sogpEnrollmentBranches.enrollmentId, s.sogpEnrollments.id))
    .leftJoin(s.churchBranches, eq(s.churchBranches.id, s.sogpEnrollmentBranches.branchId))
    .leftJoin(s.pastorAssignments, eq(s.pastorAssignments.enrollmentId, s.sogpEnrollments.id))
    .leftJoin(owner, eq(owner.id, s.pastorAssignments.pastorUserId))
    .where(scope.kind === "branches" ? inArray(s.sogpEnrollmentBranches.branchId, scope.branchIds.length ? scope.branchIds : [-1]) : undefined)
    .orderBy(desc(s.sogpEnrollments.createdAt));
}

export async function listSogpOversightBranches(viewerId: string) {
  const scope = await requireScope(viewerId);
  return db.select({ id: s.churchBranches.id, name: s.churchBranches.name })
    .from(s.churchBranches)
    .where(scope.kind === "branches" ? inArray(s.churchBranches.id, scope.branchIds.length ? scope.branchIds : [-1]) : undefined)
    .orderBy(s.churchBranches.name);
}

/** All branches are valid transfer destinations; placement remains scope-checked separately. */
export async function listSogpTransferBranches(viewerId: string) {
  await requireScope(viewerId);
  return db.select({ id: s.churchBranches.id, name: s.churchBranches.name })
    .from(s.churchBranches)
    .orderBy(s.churchBranches.name);
}

export async function listEligibleSogpDisciplers(viewerId: string) {
  const scope = await requireScope(viewerId);
  const limited = scope.kind === "branches";
  const branchIds = limited ? (scope.branchIds.length ? scope.branchIds : [-1]) : null;
  const activeEnrollment = ne(s.sogpEnrollments.status, "withdrawn");
  const [members, appointed, branchPastors] = await Promise.all([
    db.selectDistinct({ userId: s.users.id, name: s.users.name, branchId: s.churchBranchMemberships.branchId })
      .from(s.churchBranchMemberships)
      .innerJoin(s.users, eq(s.users.id, s.churchBranchMemberships.userId))
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.userId, s.users.id))
      .where(and(activeEnrollment, limited ? inArray(s.churchBranchMemberships.branchId, branchIds!) : undefined)),
    db.selectDistinct({ userId: s.users.id, name: s.users.name, branchId: s.churchAssignments.branchId })
      .from(s.churchAssignments)
      .innerJoin(s.users, eq(s.users.id, s.churchAssignments.userId))
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.userId, s.users.id))
      .where(and(activeEnrollment, sql`${s.churchAssignments.branchId} is not null`, limited ? inArray(s.churchAssignments.branchId, branchIds!) : undefined)),
    db.selectDistinct({ userId: s.users.id, name: s.users.name, branchId: s.churchBranchPastors.branchId })
      .from(s.churchBranchPastors)
      .innerJoin(s.users, eq(s.users.id, s.churchBranchPastors.userId))
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.userId, s.users.id))
      .where(and(activeEnrollment, limited ? inArray(s.churchBranchPastors.branchId, branchIds!) : undefined)),
  ]);
  const unique = new Map<string, { userId: string; name: string; branchId: number }>();
  for (const row of [...members, ...appointed, ...branchPastors]) {
    if (row.branchId !== null) unique.set(`${row.userId}:${row.branchId}`, { ...row, branchId: row.branchId });
  }
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function placeEnrollmentInBranch(input: { actorUserId: string; enrollmentId: number; branchId: number }) {
  const scope = await requireScope(input.actorUserId);
  if (!scopeIncludes(scope, input.branchId)) throw new CommunityError("Choose one of your branches.");
  return transactionDb.transaction(async (tx) => {
    const [branch] = await tx.select({ id: s.churchBranches.id }).from(s.churchBranches).where(eq(s.churchBranches.id, input.branchId));
    const [current] = await tx.select().from(s.sogpEnrollmentBranches).where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId)).for("update");
    if (!branch) throw new CommunityError("Choose an existing branch.");
    if (current && current.branchId !== input.branchId && scope.kind !== "whole_church") {
      throw new CommunityError("Transfer this enrollee instead of taking them from another branch.");
    }
    await tx.insert(s.sogpEnrollmentBranches).values({ enrollmentId: input.enrollmentId, branchId: input.branchId, assignedBy: input.actorUserId })
      .onConflictDoUpdate({ target: s.sogpEnrollmentBranches.enrollmentId, set: { branchId: input.branchId, assignedBy: input.actorUserId, updatedAt: new Date() } });
  });
}

async function eligibleDisciplerEnrollment(userId: string, branchId: number) {
  const [eligible] = await db.select({ id: s.users.id }).from(s.users)
    .leftJoin(s.churchBranchMemberships, eq(s.churchBranchMemberships.userId, s.users.id))
    .leftJoin(s.churchAssignments, eq(s.churchAssignments.userId, s.users.id))
    .where(and(eq(s.users.id, userId), or(
      eq(s.churchBranchMemberships.branchId, branchId),
      eq(s.churchAssignments.branchId, branchId),
      inArray(s.users.id, db.select({ userId: s.churchBranchPastors.userId }).from(s.churchBranchPastors).where(eq(s.churchBranchPastors.branchId, branchId))),
    ))).limit(1);
  if (!eligible) return null;
  const [enrollment] = await db.select().from(s.sogpEnrollments)
    .where(and(eq(s.sogpEnrollments.userId, userId), ne(s.sogpEnrollments.status, "withdrawn")))
    .orderBy(desc(s.sogpEnrollments.createdAt)).limit(1);
  return enrollment ?? null;
}

export async function assignEnrolleeToDiscipler(input: { actorUserId: string; enrollmentId: number; disciplerUserId: string }) {
  const scope = await requireScope(input.actorUserId);
  const [placement] = await db.select().from(s.sogpEnrollmentBranches).where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId));
  if (!placement || !scopeIncludes(scope, placement.branchId)) throw new CommunityError("That enrollee is outside your branch scope.");
  const leader = await eligibleDisciplerEnrollment(input.disciplerUserId, placement.branchId);
  if (!leader) throw new CommunityError("Choose an SOGP discipler in this branch.");
  if (leader.id === input.enrollmentId) throw new CommunityError("An enrollee cannot be assigned to their own group.");
  const [group] = await ensureDiscipleshipGroups(leader);
  if (!group?.isDefault || group.status !== "active") throw new CommunityError("That discipler's default group is not available.");

  await transactionDb.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`pleros:sogp-assignment:${input.enrollmentId}`}, 0))`);
    const [freshPlacement] = await tx.select().from(s.sogpEnrollmentBranches).where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId)).for("update");
    if (!freshPlacement || freshPlacement.branchId !== placement.branchId) throw new CommunityError("The enrollee's branch changed. Refresh and try again.");
    const [circular] = await tx.select({ id: s.discipleshipMemberships.id }).from(s.discipleshipMemberships)
      .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
      .where(and(eq(s.discipleshipMemberships.discipleEnrollmentId, leader.id), eq(s.discipleshipMemberships.status, "active"), eq(s.discipleshipGroups.leaderEnrollmentId, input.enrollmentId))).limit(1);
    if (circular) throw new CommunityError("This assignment would create a circular discipleship relationship.");
    const now = new Date();
    await tx.update(s.discipleshipMemberships).set({ status: "removed", endedAt: now })
      .where(and(eq(s.discipleshipMemberships.discipleEnrollmentId, input.enrollmentId), eq(s.discipleshipMemberships.status, "active")));
    await tx.insert(s.discipleshipMemberships).values({ groupId: group.id, discipleEnrollmentId: input.enrollmentId });
    await tx.insert(s.pastorAssignments).values({ enrollmentId: input.enrollmentId, pastorUserId: input.disciplerUserId, discipleshipGroupId: group.id, assignedBy: input.actorUserId })
      .onConflictDoUpdate({ target: s.pastorAssignments.enrollmentId, set: { pastorUserId: input.disciplerUserId, discipleshipGroupId: group.id, assignedBy: input.actorUserId, assignedAt: now, lastContactedAt: null, contactCount: 0 } });
  });
}

export async function releaseDisciplerAssignment(input: { actorUserId: string; enrollmentId: number }) {
  const scope = await requireScope(input.actorUserId);
  const [placement] = await db.select().from(s.sogpEnrollmentBranches).where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId));
  if (!placement || !scopeIncludes(scope, placement.branchId)) throw new CommunityError("That enrollee is outside your branch scope.");
  await transactionDb.transaction(async (tx) => {
    const [assignment] = await tx.select().from(s.pastorAssignments).where(eq(s.pastorAssignments.enrollmentId, input.enrollmentId)).for("update");
    if (!assignment) return;
    if (assignment.discipleshipGroupId) await tx.update(s.discipleshipMemberships).set({ status: "removed", endedAt: new Date() })
      .where(and(eq(s.discipleshipMemberships.groupId, assignment.discipleshipGroupId), eq(s.discipleshipMemberships.discipleEnrollmentId, input.enrollmentId), eq(s.discipleshipMemberships.status, "active")));
    await tx.delete(s.pastorAssignments).where(eq(s.pastorAssignments.enrollmentId, input.enrollmentId));
  });
}

export async function requestBranchTransfer(input: { actorUserId: string; enrollmentId: number; toBranchId: number }) {
  const scope = await requireScope(input.actorUserId);
  const [placement] = await db.select().from(s.sogpEnrollmentBranches).where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId));
  if (!placement || !scopeIncludes(scope, placement.branchId)) throw new CommunityError("That enrollee is outside your branch scope.");
  if (placement.branchId === input.toBranchId) throw new CommunityError("Choose another branch.");
  const [branch] = await db.select({ id: s.churchBranches.id }).from(s.churchBranches).where(eq(s.churchBranches.id, input.toBranchId));
  if (!branch) throw new CommunityError("Choose an existing branch.");
  await transactionDb.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`pleros:sogp-assignment:${input.enrollmentId}`}, 0))`);
    const [freshPlacement] = await tx.select().from(s.sogpEnrollmentBranches)
      .where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId)).for("update");
    if (!freshPlacement || freshPlacement.branchId !== placement.branchId) {
      throw new CommunityError("The enrollee's branch changed. Refresh and try again.");
    }
    const now = new Date();
    const [assignment] = await tx.select().from(s.pastorAssignments)
      .where(eq(s.pastorAssignments.enrollmentId, input.enrollmentId)).for("update");
    if (assignment?.discipleshipGroupId) {
      await tx.update(s.discipleshipMemberships).set({ status: "removed", endedAt: now })
        .where(and(
          eq(s.discipleshipMemberships.groupId, assignment.discipleshipGroupId),
          eq(s.discipleshipMemberships.discipleEnrollmentId, input.enrollmentId),
          eq(s.discipleshipMemberships.status, "active"),
        ));
    }
    await tx.delete(s.pastorAssignments).where(eq(s.pastorAssignments.enrollmentId, input.enrollmentId));
    await tx.update(s.sogpEnrollmentBranches).set({
      branchId: input.toBranchId,
      assignedBy: input.actorUserId,
      updatedAt: now,
    }).where(eq(s.sogpEnrollmentBranches.enrollmentId, input.enrollmentId));
    await tx.insert(s.sogpBranchTransfers).values({
      enrollmentId: input.enrollmentId,
      fromBranchId: placement.branchId,
      toBranchId: input.toBranchId,
      requestedBy: input.actorUserId,
      respondedBy: input.actorUserId,
      status: "accepted",
      respondedAt: now,
    });
  });
}
