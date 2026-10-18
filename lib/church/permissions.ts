export type ChurchRole = "pastor" | "branch_pastor" | "unit_leader" | "worker";
export type ChurchAssignment = { userId: string; role: string; branchId: number | null; unitId: number | null; supervisorId: string | null; branchIds?: number[] };
export const CHURCH_ROLE_LABELS: Record<ChurchRole, string> = { pastor: "Pastor", branch_pastor: "Branch Pastor", unit_leader: "Unit leader", worker: "Worker" };

export function churchBranchIds(assignment: ChurchAssignment | null): number[] {
  if (!assignment) return [];
  return assignment.role === "branch_pastor" && assignment.branchIds !== undefined ? assignment.branchIds : assignment.branchId === null ? [] : [assignment.branchId];
}

/** Organisational access is assignment-derived, never an app-role or moderator label. */
export function canReadChurchReport(viewer: ChurchAssignment | null, subject: ChurchAssignment | null): boolean {
  if (!viewer || !subject || viewer.userId === subject.userId) return false;
  if (viewer.role === "pastor") return true;
  if (viewer.role === "branch_pastor") return churchBranchIds(viewer).some(id => churchBranchIds(subject).includes(id));
  return viewer.role === "unit_leader" && viewer.branchId !== null && viewer.unitId !== null && subject.role === "worker" && subject.supervisorId === viewer.userId && subject.unitId === viewer.unitId && subject.branchId === viewer.branchId;
}
export function canManageChurchAssignments(viewer: ChurchAssignment | null): boolean {
  return viewer?.role === "pastor" || viewer?.role === "branch_pastor";
}
/** Unit leaders add workers to their own unit (user decision, 18 October); Pastors and Branch Pastors to any unit they manage. */
export function canAddUnitWorkers(viewer: ChurchAssignment | null, unitId: number): boolean {
  return canManageChurchAssignments(viewer) || (viewer?.role === "unit_leader" && viewer.unitId === unitId);
}
export function validChurchParent(role: ChurchRole, parent: ChurchAssignment | null, branchId: number | null, unitId: number | null): boolean {
  if (role === "pastor") return !parent && branchId === null && unitId === null;
  if (!parent) return false;
  if (role === "branch_pastor") return parent.role === "pastor" && unitId === null;
  if (role === "unit_leader") return parent.role === "branch_pastor" && branchId !== null && churchBranchIds(parent).includes(branchId) && unitId !== null;
  return parent.role === "unit_leader" && parent.branchId === branchId && parent.unitId === unitId && branchId !== null && unitId !== null;
}
