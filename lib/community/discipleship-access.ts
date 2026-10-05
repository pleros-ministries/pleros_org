/**
 * Who may see and run a discipleship group's discussion space. Pure so the
 * privacy rule is unit-tested: only the group's discipler and its current
 * disciples can see it. Admin access is deliberately absent — admins see a
 * discipleship post only when it is reported.
 */
export type DiscipleshipAccess = {
  /** Active groups the viewer leads as discipler. */
  ledGroupIds: number[];
  /** Active groups the viewer currently belongs to as a disciple. */
  joinedGroupIds: number[];
};

export const NO_DISCIPLESHIP_ACCESS: DiscipleshipAccess = {
  ledGroupIds: [],
  joinedGroupIds: [],
};

export function leadsDiscipleshipGroup(
  access: DiscipleshipAccess,
  groupId: number,
): boolean {
  return access.ledGroupIds.includes(groupId);
}

export function canViewDiscipleshipGroup(
  access: DiscipleshipAccess,
  groupId: number,
): boolean {
  return (
    access.ledGroupIds.includes(groupId) ||
    access.joinedGroupIds.includes(groupId)
  );
}
