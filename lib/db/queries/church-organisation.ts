import "server-only";
import { and, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { canManageChurchAssignments, canReadChurchReport, validChurchParent, type ChurchAssignment, type ChurchRole } from "@/lib/church/permissions";

export function churchOrganisationEnabled() { return process.env.DASHBOARD_CHURCH_V2 === "1"; }
function requireEnabled() { if (!churchOrganisationEnabled()) throw new CommunityError("Church assignments are not enabled yet."); }
export async function getChurchAssignment(userId: string): Promise<ChurchAssignment | null> {
  if (!churchOrganisationEnabled()) return null;
  const [row] = await db.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, userId)).limit(1);
  return row ?? null;
}
export async function getChurchRoster(viewerId: string) {
  const viewer = await getChurchAssignment(viewerId);
  if (!viewer || viewer.role === "worker") return [];
  const scope = viewer.role === "pastor" ? undefined : viewer.role === "branch_pastor" ? eq(s.churchAssignments.branchId, viewer.branchId!) : and(eq(s.churchAssignments.supervisorId, viewerId), eq(s.churchAssignments.role, "worker"), eq(s.churchAssignments.unitId, viewer.unitId!));
  return db.select({ userId: s.churchAssignments.userId, role: s.churchAssignments.role, branchId: s.churchAssignments.branchId, unitId: s.churchAssignments.unitId, supervisorId: s.churchAssignments.supervisorId, name: s.users.name, branchName: s.churchBranches.name, unitName: s.churchUnits.name })
    .from(s.churchAssignments).innerJoin(s.users, eq(s.users.id, s.churchAssignments.userId))
    .leftJoin(s.churchBranches, eq(s.churchBranches.id, s.churchAssignments.branchId))
    .leftJoin(s.churchUnits, eq(s.churchUnits.id, s.churchAssignments.unitId)).where(scope).orderBy(s.users.name);
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
  const branchId = viewer?.role === "branch_pastor" ? viewer.branchId : null;
  const [branches, units] = await Promise.all([
    db.select().from(s.churchBranches).where(branchId ? eq(s.churchBranches.id, branchId) : undefined),
    db.select().from(s.churchUnits).where(branchId ? eq(s.churchUnits.branchId, branchId) : undefined),
  ]);
  return { branches, units };
}
/** Appointment search deliberately returns names/IDs only, never contact information. */
export async function searchChurchCandidates(viewerId: string, query: string, bootstrap = false) {
  requireEnabled();
  if (!bootstrap && !canManageChurchAssignments(await getChurchAssignment(viewerId))) throw new CommunityError("You cannot appoint church workers.");
  if (query.trim().length < 2) return [];
  const escaped = query.trim().slice(0, 80).replace(/[\\%_]/g, "\\$&");
  return db.select({ id: s.users.id, name: s.users.name }).from(s.users).where(ilike(s.users.name, `%${escaped}%`)).orderBy(s.users.name).limit(20);
}

export async function assignChurchMember(actorId: string, input: { userId: string; role: ChurchRole; branchId: number | null; unitId: number | null; supervisorId: string | null }, bootstrap = false) {
  requireEnabled();
  if (!["pastor", "branch_pastor", "unit_leader", "worker"].includes(input.role)) throw new CommunityError("Choose a church role.");
  return transactionDb.transaction(async (tx) => {
    // Serialize appointment changes, including supervisor moves and initial Pastor setup.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    const [actor] = await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, actorId));
    const [current] = await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, input.userId));
    const [user] = await tx.select({ id: s.users.id }).from(s.users).where(eq(s.users.id, input.userId));
    if (!user) throw new CommunityError("Choose an existing member.");
    if (input.role === "pastor") {
      if (!bootstrap) throw new CommunityError("Only super-admin setup can appoint the Pastor.");
      const [root] = await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.role, "pastor"));
      if (root && root.userId !== input.userId) throw new CommunityError("A Pastor is already appointed.");
    } else if (!actor || !canManageChurchAssignments(actor)) throw new CommunityError("You cannot manage church assignments.");
    if (actor?.role === "branch_pastor" && (input.role === "branch_pastor" || input.role === "pastor" || input.branchId !== actor.branchId || (current && current.branchId !== actor.branchId))) throw new CommunityError("Manage only workers and unit leaders in your branch.");
    const parent = input.supervisorId ? (await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, input.supervisorId)))[0] ?? null : null;
    if (input.supervisorId === input.userId || !validChurchParent(input.role, parent, input.branchId, input.unitId)) throw new CommunityError("Choose a supervisor in the correct branch and unit.");
    if (input.branchId !== null && !(await tx.select({ id: s.churchBranches.id }).from(s.churchBranches).where(eq(s.churchBranches.id, input.branchId)))[0]) throw new CommunityError("Choose a branch.");
    if (input.unitId !== null && !(await tx.select({ id: s.churchUnits.id }).from(s.churchUnits).where(and(eq(s.churchUnits.id, input.unitId), eq(s.churchUnits.branchId, input.branchId!))))[0]) throw new CommunityError("Choose a unit in that branch.");
    const [dependent] = await tx.select({ id: s.churchAssignments.userId }).from(s.churchAssignments).where(eq(s.churchAssignments.supervisorId, input.userId)).limit(1);
    if (dependent && current && (current.role !== input.role || current.branchId !== input.branchId || current.unitId !== input.unitId)) throw new CommunityError("Reassign this leader's direct reports before changing their role or location.");
    await tx.insert(s.churchAssignments).values({ ...input, assignedBy: actorId }).onConflictDoUpdate({ target: s.churchAssignments.userId, set: { ...input, assignedBy: actorId, updatedAt: new Date() } });
  });
}
export async function createChurchPlace(actorId: string, input: { name: string; branchId?: number }) {
  requireEnabled();
  const name = input.name.trim();
  if (!name || name.length > 100) throw new CommunityError("Enter a name under 100 characters.");
  return transactionDb.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    const [actor] = await tx.select().from(s.churchAssignments).where(eq(s.churchAssignments.userId, actorId));
    if (!actor || !canManageChurchAssignments(actor)) throw new CommunityError("You cannot manage church assignments.");
    if (!input.branchId) {
      if (actor.role !== "pastor") throw new CommunityError("Only the Pastor creates branches.");
      await tx.insert(s.churchBranches).values({ name });
    } else {
      if (actor.role === "branch_pastor" && actor.branchId !== input.branchId) throw new CommunityError("Choose your own branch.");
      const [branch] = await tx.select({ id: s.churchBranches.id }).from(s.churchBranches).where(eq(s.churchBranches.id, input.branchId));
      if (!branch) throw new CommunityError("Choose an existing branch.");
      await tx.insert(s.churchUnits).values({ name, branchId: input.branchId });
    }
  });
}

export async function hasChurchDirectReports(userId: string) {
  if (!churchOrganisationEnabled()) return false;
  return Boolean((await db.select({ id: s.churchAssignments.userId }).from(s.churchAssignments).where(eq(s.churchAssignments.supervisorId, userId)).limit(1))[0]);
}
