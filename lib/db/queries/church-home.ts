import "server-only";
import { cache } from "react";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { canManageChurchAssignments, churchBranchIds, type ChurchAssignment } from "@/lib/church/permissions";
import { churchOrganisationEnabled, getChurchAssignment, getChurchRoster } from "./church-organisation";

/**
 * Role-shaped church read model for the Paper church screens. Scope comes from
 * the viewer's own assignment (Pastor: all branches; Branch Pastor: their
 * branches; unit leader: their unit; worker: their own reporting line).
 * Names and counts only: no contacts, notes or report content.
 */
export type ChurchUnitSummary = { id: number; name: string; branchId: number; leader: { userId: string; name: string } | null; workerCount: number };
export type ChurchBranchSummary = { id: number; name: string; pastors: { userId: string; name: string }[]; units: ChurchUnitSummary[]; workerCount: number; leaderlessUnits: number };
export type ChurchHome =
  | { kind: "none" }
  | { kind: "structure"; role: "pastor" | "branch_pastor"; viewerName: string; branches: ChurchBranchSummary[]; totals: { branches: number; units: number; workers: number } }
  | { kind: "unit"; unit: { id: number; name: string; branchName: string }; leaderName: string; reportsTo: string | null; workers: { userId: string; name: string }[] }
  | { kind: "placement"; name: string; unitName: string | null; branchName: string | null; line: { role: string; name: string; scope: string }[] };

async function names(ids: string[]) {
  if (!ids.length) return new Map<string, string>();
  const rows = await db.select({ id: s.users.id, name: s.users.name }).from(s.users).where(inArray(s.users.id, ids));
  return new Map(rows.map(row => [row.id, row.name]));
}

async function readChurchHome(viewerId: string): Promise<ChurchHome> {
  if (!churchOrganisationEnabled()) return { kind: "none" };
  const viewer = await getChurchAssignment(viewerId);
  if (!viewer) return { kind: "none" };
  if (canManageChurchAssignments(viewer)) return structure(viewerId, viewer);
  if (viewer.role === "unit_leader") return unit(viewerId, viewer);
  return placement(viewerId, viewer);
}

async function structure(viewerId: string, viewer: ChurchAssignment): Promise<ChurchHome> {
  const limited = viewer.role === "branch_pastor";
  const ids = churchBranchIds(viewer);
  const [branches, units, roster, me] = await Promise.all([
    db.select({ id: s.churchBranches.id, name: s.churchBranches.name }).from(s.churchBranches).where(limited ? inArray(s.churchBranches.id, ids.length ? ids : [-1]) : undefined).orderBy(s.churchBranches.name),
    db.select({ id: s.churchUnits.id, name: s.churchUnits.name, branchId: s.churchUnits.branchId }).from(s.churchUnits).where(limited ? inArray(s.churchUnits.branchId, ids.length ? ids : [-1]) : undefined).orderBy(s.churchUnits.name),
    getChurchRoster(viewerId),
    names([viewerId]),
  ]);
  const summaries = branches.map(branch => {
    const branchUnits = units.filter(row => row.branchId === branch.id).map(row => {
      const leader = roster.find(member => member.role === "unit_leader" && member.unitId === row.id);
      return { ...row, leader: leader ? { userId: leader.userId, name: leader.name } : null, workerCount: roster.filter(member => member.role === "worker" && member.unitId === row.id).length };
    });
    const pastors = roster.filter(member => member.role === "branch_pastor" && churchBranchIds(member as ChurchAssignment).includes(branch.id)).map(member => ({ userId: member.userId, name: member.name }));
    if (limited && !pastors.some(row => row.userId === viewerId)) pastors.unshift({ userId: viewerId, name: me.get(viewerId) ?? "You" });
    return { id: branch.id, name: branch.name, pastors, units: branchUnits, workerCount: branchUnits.reduce((sum, row) => sum + row.workerCount, 0), leaderlessUnits: branchUnits.filter(row => !row.leader).length };
  });
  return { kind: "structure", role: viewer.role as "pastor" | "branch_pastor", viewerName: me.get(viewerId) ?? "", branches: summaries,
    totals: { branches: summaries.length, units: units.length, workers: summaries.reduce((sum, row) => sum + row.workerCount, 0) } };
}

async function unit(viewerId: string, viewer: ChurchAssignment): Promise<ChurchHome> {
  const [[place], roster, people] = await Promise.all([
    db.select({ id: s.churchUnits.id, name: s.churchUnits.name, branchName: s.churchBranches.name }).from(s.churchUnits).innerJoin(s.churchBranches, eq(s.churchBranches.id, s.churchUnits.branchId)).where(eq(s.churchUnits.id, viewer.unitId ?? -1)),
    getChurchRoster(viewerId),
    names([viewerId, ...(viewer.supervisorId ? [viewer.supervisorId] : [])]),
  ]);
  return { kind: "unit", unit: place ?? { id: viewer.unitId ?? 0, name: "Your unit", branchName: "" }, leaderName: people.get(viewerId) ?? "", reportsTo: viewer.supervisorId ? people.get(viewer.supervisorId) ?? null : null,
    workers: roster.filter(row => row.role === "worker").map(row => ({ userId: row.userId, name: row.name })) };
}

/** A worker's own reporting line: names only, walking up at most three supervisors. */
async function placement(viewerId: string, viewer: ChurchAssignment): Promise<ChurchHome> {
  const chain: ChurchAssignment[] = [viewer];
  let next = viewer.supervisorId;
  for (let depth = 0; next && depth < 3; depth += 1) {
    const parent = await getChurchAssignment(next);
    if (!parent) break;
    chain.push(parent);
    next = parent.supervisorId;
  }
  const [people, [place]] = await Promise.all([
    names(chain.map(row => row.userId)),
    db.select({ unitName: s.churchUnits.name, branchName: s.churchBranches.name }).from(s.churchBranches).leftJoin(s.churchUnits, eq(s.churchUnits.id, viewer.unitId ?? -1)).where(eq(s.churchBranches.id, viewer.branchId ?? -1)),
  ]);
  const labels: Record<string, string> = { pastor: "Pastor", branch_pastor: "Branch pastor", unit_leader: "Unit leader", worker: "Worker" };
  return { kind: "placement", name: people.get(viewerId) ?? "", unitName: place?.unitName ?? null, branchName: place?.branchName ?? null,
    line: [...chain].reverse().map(row => ({ role: labels[row.role] ?? row.role, name: people.get(row.userId) ?? "", scope: row.role === "pastor" ? "Fullness of Christ Church" : row.role === "branch_pastor" ? `${place?.branchName ?? "Branch"}` : row.role === "unit_leader" ? `${place?.unitName ?? "Unit"} team` : `Worker${place?.unitName ? ` · ${place.unitName}` : ""}` })) };
}

/**
 * A branch or unit inside the manager's own scope (Pastor: all; Branch Pastor:
 * their branches), with its leaders. Null when outside scope.
 */
export async function getChurchPlace(viewerId: string, input: { branchId?: number; unitId?: number }) {
  const viewer = await getChurchAssignment(viewerId);
  if (!viewer || !canManageChurchAssignments(viewer)) return null;
  const [unitRow] = input.unitId ? await db.select({ id: s.churchUnits.id, name: s.churchUnits.name, branchId: s.churchUnits.branchId }).from(s.churchUnits).where(eq(s.churchUnits.id, input.unitId)) : [];
  const branchId = unitRow?.branchId ?? input.branchId;
  if (!branchId || input.unitId && !unitRow) return null;
  if (viewer.role === "branch_pastor" && !churchBranchIds(viewer).includes(branchId)) return null;
  const [branch] = await db.select({ id: s.churchBranches.id, name: s.churchBranches.name }).from(s.churchBranches).where(eq(s.churchBranches.id, branchId));
  if (!branch) return null;
  const roster = await getChurchRoster(viewerId);
  const pastors = roster.filter(row => row.role === "branch_pastor" && churchBranchIds(row as ChurchAssignment).includes(branchId)).map(row => ({ userId: row.userId, name: row.name }));
  if (viewer.role === "branch_pastor" && !pastors.some(row => row.userId === viewerId)) pastors.unshift({ userId: viewerId, name: (await names([viewerId])).get(viewerId) ?? "You" });
  const unit = unitRow ? (() => {
    const leader = roster.find(row => row.role === "unit_leader" && row.unitId === unitRow.id);
    return { ...unitRow, leader: leader ? { userId: leader.userId, name: leader.name } : null, workers: roster.filter(row => row.role === "worker" && row.unitId === unitRow.id).map(row => ({ userId: row.userId, name: row.name })) };
  })() : null;
  return { viewerRole: viewer.role as "pastor" | "branch_pastor", viewerId, branch, pastors, unit };
}
export type ChurchPlace = NonNullable<Awaited<ReturnType<typeof getChurchPlace>>>;

/** Request-scoped: layouts, pages and loaders read this repeatedly in one render. */
export const getChurchHome = cache(readChurchHome);
