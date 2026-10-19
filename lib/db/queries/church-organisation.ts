import "server-only";
import { cache } from "react";
import { and, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import type { Tx } from "./outreach-contacts";
import { CommunityError } from "@/lib/community/errors";
import { fuzzyNameScore, nameTokens } from "@/lib/community/fuzzy-name";
import { canManageChurchAssignments, canReadChurchReport, churchBranchIds, validChurchParent, type ChurchAssignment, type ChurchRole } from "@/lib/church/permissions";

/** Default-live (0051/0053 installed); set the flag to "0" to roll back. */
export function churchOrganisationEnabled() { return process.env.DASHBOARD_CHURCH_V2 !== "0"; }
export function churchMultiBranchEnabled() { return churchOrganisationEnabled() && process.env.DASHBOARD_CHURCH_MULTI_BRANCH_V2 !== "0"; }
function requireEnabled() { if (!churchOrganisationEnabled()) throw new CommunityError("Church assignments are not enabled yet."); }
async function readChurchAssignment(userId: string): Promise<ChurchAssignment | null> {
  if (!churchOrganisationEnabled()) return null;
  const [row] = await db.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, userId)).limit(1);
  if (!row) return null;
  if (row.role === "branch_pastor" && churchMultiBranchEnabled()) {
    const links = await db.select({ branchId: s.churchBranchPastors.branchId }).from(s.churchBranchPastors).where(eq(s.churchBranchPastors.userId, userId));
    return { ...row, branchIds: links.map(link => link.branchId) };
  }
  return row;
}
export async function getChurchRoster(viewerId: string) {
  const viewer = await getChurchAssignment(viewerId);
  if (!viewer || viewer.role === "worker") return [];
  const ids = churchBranchIds(viewer);
  if (viewer.role === "branch_pastor" && !ids.length) return [];
  const branchScope = churchMultiBranchEnabled() ? or(inArray(s.churchAssignments.branchId, ids), inArray(s.churchAssignments.userId, db.select({ userId: s.churchBranchPastors.userId }).from(s.churchBranchPastors).where(inArray(s.churchBranchPastors.branchId, ids)))) : inArray(s.churchAssignments.branchId, ids);
  const scope = viewer.role === "pastor" ? undefined : viewer.role === "branch_pastor" ? branchScope : and(eq(s.churchAssignments.supervisorId, viewerId), eq(s.churchAssignments.role, "worker"), eq(s.churchAssignments.unitId, viewer.unitId!), eq(s.churchAssignments.branchId, viewer.branchId!));
  const rows = await db.select({ userId: s.churchAssignments.userId, role: s.churchAssignments.role, branchId: s.churchAssignments.branchId, unitId: s.churchAssignments.unitId, supervisorId: s.churchAssignments.supervisorId, name: s.users.name, branchName: s.churchBranches.name, unitName: s.churchUnits.name })
    .from(s.churchAssignments).innerJoin(s.users, eq(s.users.id, s.churchAssignments.userId))
    .leftJoin(s.churchBranches, eq(s.churchBranches.id, s.churchAssignments.branchId))
    .leftJoin(s.churchUnits, eq(s.churchUnits.id, s.churchAssignments.unitId)).where(scope).orderBy(s.users.name);
  if (!churchMultiBranchEnabled() || !rows.length) return rows;
  const links = await db.select({ userId: s.churchBranchPastors.userId, branchId: s.churchBranchPastors.branchId, name: s.churchBranches.name }).from(s.churchBranchPastors).innerJoin(s.churchBranches, eq(s.churchBranches.id, s.churchBranchPastors.branchId)).where(inArray(s.churchBranchPastors.userId, rows.map(row => row.userId)));
  return rows.map(row => row.role === "branch_pastor" ? { ...row, branchIds: links.filter(link => link.userId === row.userId).map(link => link.branchId), branchName: links.filter(link => link.userId === row.userId).map(link => link.name).join(" · ") || null } : row);
}
export async function requireChurchReportAccess(viewerId: string, subjectId: string) {
  const [viewer, subject] = await Promise.all([getChurchAssignment(viewerId), getChurchAssignment(subjectId)]);
  if (!canReadChurchReport(viewer, subject)) throw new CommunityError("That report is outside your oversight.");
  return subject!;
}
export async function getChurchStructure(viewerId: string, bootstrap = false) {
  if (!churchOrganisationEnabled()) return { branches: [], units: [] };
  const viewer = await getChurchAssignment(viewerId);
  if (!bootstrap && !canManageChurchAssignments(viewer)) return { branches: [], units: [] };
  const limited = viewer?.role === "branch_pastor";
  const ids = churchBranchIds(viewer);
  if (limited && !ids.length) return { branches: [], units: [] };
  const [branches, units] = await Promise.all([
    db.select().from(s.churchBranches).where(limited ? inArray(s.churchBranches.id, ids) : undefined),
    db.select().from(s.churchUnits).where(limited ? inArray(s.churchUnits.branchId, ids) : undefined),
  ]);
  return { branches, units };
}
export async function loadChurchAssignmentForTransaction(tx: Tx, userId: string): Promise<ChurchAssignment | null> {
  const [row] = await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, userId));
  if (!row) return null;
  if (row.role !== "branch_pastor" || !churchMultiBranchEnabled()) return row;
  const links = await tx.select({ branchId: s.churchBranchPastors.branchId }).from(s.churchBranchPastors).where(eq(s.churchBranchPastors.userId, userId));
  return { ...row, branchIds: links.map(link => link.branchId) };
}

/** Appointment search deliberately returns names/IDs only, never contact information. */
export async function searchChurchCandidates(viewerId: string, query: string, bootstrap = false) {
  requireEnabled();
  const searcher = bootstrap ? null : await getChurchAssignment(viewerId);
  // Unit leaders search too, to add workers to their own unit; names and IDs only either way.
  if (!bootstrap && !canManageChurchAssignments(searcher) && searcher?.role !== "unit_leader") throw new CommunityError("You cannot appoint church workers.");
  const term = query.trim().slice(0, 80);
  if (term.length < 2) return [];
  // Forgiving search (user report, 18 October: people were missing): match the
  // account name, the SOGP enrolment name and email, loosely in SQL by each
  // typed word's first letters, then rank with the inbox's fuzzy name matcher.
  const tokens = nameTokens(term);
  if (!tokens.length) return [];
  const loose = tokens.map(token => `%${token.slice(0, token.length >= 4 ? 3 : 2).replace(/[\\%_]/g, "\\$&")}%`);
  const rows = await db
    .select({ id: s.users.id, name: s.users.name, email: s.users.email, enrolledName: s.sogpEnrollments.name })
    .from(s.users)
    .leftJoin(s.sogpEnrollments, eq(s.sogpEnrollments.userId, s.users.id))
    .where(or(...loose.flatMap(pattern => [ilike(s.users.name, pattern), ilike(s.sogpEnrollments.name, pattern), ilike(s.users.email, pattern)])))
    .limit(600);
  const best = new Map<string, { id: string; name: string; score: number }>();
  for (const row of rows) {
    const accountName = row.name?.trim() && !row.name.includes("@") ? row.name.trim() : "";
    const display = accountName || row.enrolledName?.trim() || row.email.split("@")[0]!;
    const score = Math.max(
      fuzzyNameScore(term, accountName),
      fuzzyNameScore(term, row.enrolledName ?? ""),
      fuzzyNameScore(term, row.email.split("@")[0]!.replace(/[._\d]+/g, " ")),
    );
    if (!score) continue;
    const current = best.get(row.id);
    if (!current || score > current.score) best.set(row.id, { id: row.id, name: display, score });
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map(({ id, name }) => ({ id, name }));
}

export async function assignChurchMember(actorId: string, input: { userId: string; role: ChurchRole; branchId: number | null; unitId: number | null; supervisorId: string | null; branchIds?: number[] }, bootstrap = false) {
  requireEnabled();
  if (!["pastor", "branch_pastor", "unit_leader", "worker"].includes(input.role)) throw new CommunityError("Choose a church role.");
  return transactionDb.transaction(async (tx) => {
    // Serialize appointment changes, including supervisor moves and initial Pastor setup.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    const actor = await loadChurchAssignmentForTransaction(tx, actorId);
    const current = await loadChurchAssignmentForTransaction(tx, input.userId);
    const multi = churchMultiBranchEnabled();
    const rawBranchIds = input.branchIds ?? (input.branchId === null ? [] : [input.branchId]);
    if (input.role === "branch_pastor" && multi && (!Array.isArray(rawBranchIds) || rawBranchIds.length > 200)) throw new CommunityError("Choose valid branch assignments.");
    const branchIds = input.role === "branch_pastor" && multi ? [...new Set(rawBranchIds)] : [];
    if (branchIds.some(id => !Number.isInteger(id) || id <= 0)) throw new CommunityError("Choose valid branches.");
    const primaryBranch = input.role === "branch_pastor" && multi ? branchIds[0] ?? null : input.branchId;
    if (!multi && input.role === "branch_pastor" && primaryBranch === null) throw new CommunityError("Choose a branch.");
    const [user] = await tx.select({ id: s.users.id }).from(s.users).where(eq(s.users.id, input.userId));
    if (!user) throw new CommunityError("Choose an existing member.");
    if (input.role === "pastor") {
      if (!bootstrap) throw new CommunityError("Only super-admin setup can appoint the Pastor.");
      const [root] = await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.role, "pastor"));
      if (root && root.userId !== input.userId) throw new CommunityError("A Pastor is already appointed.");
    } else if (actor?.role === "unit_leader") {
      // A unit leader adds workers to their own unit, reporting to them (user decision, 18 October).
      // They never take someone who holds another role or serves in another unit.
      if (input.role !== "worker" || input.unitId !== actor.unitId || input.branchId !== actor.branchId || input.supervisorId !== actorId) throw new CommunityError("Add workers to your own unit only.");
      if (current && !(current.role === "worker" && current.unitId === actor.unitId)) throw new CommunityError("This person already has a church role. Ask your branch pastor to move them.");
    } else if (!actor || !canManageChurchAssignments(actor)) throw new CommunityError("You cannot manage church assignments.");
    // Authorise the existing appointment, not just its requested replacement.
    // Demotion must never turn a peer/senior appointment into an editable target.
    if (actor?.role === "branch_pastor" && (
      !["worker", "unit_leader"].includes(input.role) ||
      (current && !["worker", "unit_leader"].includes(current.role))
    )) throw new CommunityError("Manage only workers and unit leaders in your branch.");
    const requestedBranches = input.role === "branch_pastor" && multi ? branchIds : primaryBranch === null ? [] : [primaryBranch];
    // Saving in multi-branch mode replaces all membership rows, including any
    // stale links on lower-tier appointments. Validate those removals as well.
    const memberships = multi ? await tx.select({ branchId: s.churchBranchPastors.branchId }).from(s.churchBranchPastors).where(eq(s.churchBranchPastors.userId, input.userId)) : [];
    const dependents = await tx.select({ id: s.churchAssignments.userId, branchId: s.churchAssignments.branchId }).from(s.churchAssignments).where(eq(s.churchAssignments.supervisorId, input.userId));
    const affectedBranches = [...new Set([
      ...requestedBranches,
      ...(current?.branchId == null ? [] : [current.branchId]),
      ...memberships.map(row => row.branchId),
      ...dependents.flatMap(row => row.branchId === null ? [] : [row.branchId]),
    ])];
    if (actor?.role === "branch_pastor" && (
      primaryBranch === null || !churchBranchIds(actor).includes(primaryBranch) ||
      affectedBranches.some(id => !churchBranchIds(actor).includes(id))
    )) throw new CommunityError("Manage only workers and unit leaders in your branch.");
    const parent = input.supervisorId ? await loadChurchAssignmentForTransaction(tx, input.supervisorId) : null;
    if (input.supervisorId === input.userId || !validChurchParent(input.role, parent, primaryBranch, input.unitId)) throw new CommunityError("Choose a supervisor in the correct branch and unit.");
    if (affectedBranches.some(id => !Number.isInteger(id) || id <= 0)) throw new CommunityError("Choose valid branches.");
    if (affectedBranches.length && (await tx.select({ id: s.churchBranches.id }).from(s.churchBranches).where(inArray(s.churchBranches.id, affectedBranches))).length !== affectedBranches.length) throw new CommunityError("Choose existing branches.");
    if (input.unitId !== null && !(await tx.select({ id: s.churchUnits.id }).from(s.churchUnits).where(and(eq(s.churchUnits.id, input.unitId), eq(s.churchUnits.branchId, input.branchId!))))[0]) throw new CommunityError("Choose a unit in that branch.");
    const dependent = dependents[0];
    if (current?.role === "branch_pastor" && input.role === "branch_pastor" && multi && dependents.some(row => row.branchId === null || !branchIds.includes(row.branchId))) throw new CommunityError("Reassign direct reports before removing their branch.");
    if (dependent && current && (current.role !== input.role || (current.role !== "branch_pastor" && current.branchId !== primaryBranch) || current.unitId !== input.unitId)) throw new CommunityError("Reassign this leader's direct reports before changing their role or location.");
    const assignment = { userId: input.userId, role: input.role, branchId: primaryBranch, unitId: input.unitId, supervisorId: input.supervisorId, assignedBy: actorId };
    await tx.insert(s.churchAssignments).values(assignment).onConflictDoUpdate({ target: s.churchAssignments.userId, set: { ...assignment, updatedAt: new Date() } });
    if (multi) {
      await tx.delete(s.churchBranchPastors).where(eq(s.churchBranchPastors.userId, input.userId));
      if (branchIds.length) await tx.insert(s.churchBranchPastors).values(branchIds.map(branchId => ({ userId: input.userId, branchId })));
    }
  });
}

/** Places any signed-up church member in one branch without giving them an organisational role. */
export async function assignChurchBranchMembership(actorId: string, input: { userId: string; branchId: number }) {
  requireEnabled();
  const actor = await getChurchAssignment(actorId);
  if (!canManageChurchAssignments(actor)) throw new CommunityError("You cannot place church members.");
  if (actor?.role === "branch_pastor" && !churchBranchIds(actor).includes(input.branchId)) {
    throw new CommunityError("Choose one of your branches.");
  }
  const [[user], [branch]] = await Promise.all([
    db.select({ id: s.users.id }).from(s.users).where(eq(s.users.id, input.userId)).limit(1),
    db.select({ id: s.churchBranches.id }).from(s.churchBranches).where(eq(s.churchBranches.id, input.branchId)).limit(1),
  ]);
  if (!user || !branch) throw new CommunityError("Choose an existing member and branch.");
  await db.insert(s.churchBranchMemberships).values({
    userId: input.userId,
    branchId: input.branchId,
    assignedBy: actorId,
  }).onConflictDoUpdate({
    target: s.churchBranchMemberships.userId,
    set: { branchId: input.branchId, assignedBy: actorId, updatedAt: new Date() },
  });
  const enrollments = await db.select({ id: s.sogpEnrollments.id })
    .from(s.sogpEnrollments)
    .where(and(eq(s.sogpEnrollments.userId, input.userId), ne(s.sogpEnrollments.status, "withdrawn")));
  if (enrollments.length) {
    await db.insert(s.sogpEnrollmentBranches).values(enrollments.map(enrollment => ({
      enrollmentId: enrollment.id,
      branchId: input.branchId,
      assignedBy: actorId,
    }))).onConflictDoNothing();
  }
}
export async function createChurchPlace(actorId: string, input: { name: string; branchId?: number }): Promise<number> {
  requireEnabled();
  const name = input.name.trim();
  if (!name || name.length > 100) throw new CommunityError("Enter a name under 100 characters.");
  return transactionDb.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    const actor = await loadChurchAssignmentForTransaction(tx, actorId);
    if (!actor || !canManageChurchAssignments(actor)) throw new CommunityError("You cannot manage church assignments.");
    if (!input.branchId) {
      if (actor.role !== "pastor") throw new CommunityError("Only the Pastor creates branches.");
      const [created] = await tx.insert(s.churchBranches).values({ name }).onConflictDoNothing().returning({ id: s.churchBranches.id });
      if (!created) throw new CommunityError("A branch with that name already exists.");
      return created.id;
    } else {
      if (actor.role === "branch_pastor" && !churchBranchIds(actor).includes(input.branchId)) throw new CommunityError("Choose your own branch.");
      const [branch] = await tx.select({ id: s.churchBranches.id }).from(s.churchBranches).where(eq(s.churchBranches.id, input.branchId));
      if (!branch) throw new CommunityError("Choose an existing branch.");
      const [created] = await tx.insert(s.churchUnits).values({ name, branchId: input.branchId }).onConflictDoNothing().returning({ id: s.churchUnits.id });
      if (!created) throw new CommunityError("That branch already has a unit with this name.");
      return created.id;
    }
  });
}

async function readHasChurchDirectReports(userId: string) {
  if (!churchOrganisationEnabled()) return false;
  return Boolean((await db.select({ id: s.churchAssignments.userId }).from(s.churchAssignments).where(eq(s.churchAssignments.supervisorId, userId)).limit(1))[0]);
}

/** Request-scoped: layouts, pages and loaders read this repeatedly in one render. */
export const getChurchAssignment = cache(readChurchAssignment);
export const hasChurchDirectReports = cache(readHasChurchDirectReports);
