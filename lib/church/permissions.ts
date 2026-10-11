export type ChurchRole = "pastor" | "branch_pastor" | "unit_leader" | "worker";
export type ChurchAssignment = { userId: string; role: string; branchId: number | null; unitId: number | null; supervisorId: string | null };
export const CHURCH_ROLE_LABELS: Record<ChurchRole, string> = { pastor: "Pastor", branch_pastor: "Branch Pastor", unit_leader: "Unit leader", worker: "Worker" };

/** Organisational access is assignment-derived, never an app-role or moderator label. */
export function canReadChurchReport(viewer: ChurchAssignment | null, subject: ChurchAssignment | null): boolean {
  if (!viewer || !subject || viewer.userId === subject.userId) return false;
  if (viewer.role === "pastor") return true;
  if (viewer.role === "branch_pastor") return viewer.branchId !== null && viewer.branchId === subject.branchId;
  return viewer.role === "unit_leader" && viewer.branchId !== null && viewer.unitId !== null && subject.role === "worker" && subject.supervisorId === viewer.userId && subject.unitId === viewer.unitId && subject.branchId === viewer.branchId;
}
export function canManageChurchAssignments(viewer: ChurchAssignment | null): boolean {
  return viewer?.role === "pastor" || viewer?.role === "branch_pastor";
}
export function validChurchParent(role: ChurchRole, parent: ChurchAssignment | null, branchId: number | null, unitId: number | null): boolean {
  if (role === "pastor") return !parent && branchId === null && unitId === null;
  if (!parent) return false;
  if (role === "branch_pastor") return parent.role === "pastor" && branchId !== null && unitId === null;
  if (role === "unit_leader") return parent.role === "branch_pastor" && parent.branchId === branchId && branchId !== null && unitId !== null;
  return parent.role === "unit_leader" && parent.branchId === branchId && parent.unitId === unitId && branchId !== null && unitId !== null;
}
