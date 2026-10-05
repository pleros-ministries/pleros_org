/**
 * Rules for member-created groups. Pure so they are unit-tested and shared by
 * the queries, server actions and UI. Location groups (`units`) and
 * discipleship groups have their own rules.
 */

export const GROUP_NAME_MIN = 3;
export const GROUP_NAME_MAX = 60;
export const GROUP_DESCRIPTION_MAX = 500;
/** Active groups one learner may own at a time. */
export const GROUPS_OWNED_MAX = 3;

export type GroupPrivacy = "public" | "private";
export type GroupRole = "owner" | "moderator" | "member";
export type GroupMemberStatus = "active" | "pending" | "banned";
export type GroupStatus = "active" | "archived";

/** A viewer's relationship to one group. */
export type GroupAccess = {
  groupId: number;
  privacy: GroupPrivacy;
  status: GroupStatus;
  /** The viewer's membership row, if they have one in any state. */
  membership: { role: GroupRole; status: GroupMemberStatus } | null;
};

export type GroupInput = {
  name: string;
  description: string;
  privacy: GroupPrivacy;
};

export function normaliseGroupInput(input: {
  name?: string | null;
  description?: string | null;
  privacy?: string | null;
}): { ok: true; value: GroupInput } | { ok: false; error: string } {
  const name = (input.name ?? "").replace(/\s+/g, " ").trim();
  const description = (input.description ?? "").trim();

  if (name.length < GROUP_NAME_MIN) {
    return {
      ok: false,
      error: `Give the group a name of at least ${GROUP_NAME_MIN} characters.`,
    };
  }
  if (name.length > GROUP_NAME_MAX) {
    return {
      ok: false,
      error: `Keep the group name under ${GROUP_NAME_MAX} characters.`,
    };
  }
  if (description.length > GROUP_DESCRIPTION_MAX) {
    return {
      ok: false,
      error: `Keep the description under ${GROUP_DESCRIPTION_MAX} characters.`,
    };
  }
  return {
    ok: true,
    value: {
      name,
      description,
      privacy: input.privacy === "private" ? "private" : "public",
    },
  };
}

function activeRole(access: GroupAccess): GroupRole | null {
  return access.membership?.status === "active" ? access.membership.role : null;
}

export function isGroupMember(access: GroupAccess): boolean {
  return activeRole(access) !== null;
}

/** Owners and moderators run a group. */
export function managesGroup(access: GroupAccess): boolean {
  const role = activeRole(access);
  return role === "owner" || role === "moderator";
}

export function ownsGroup(access: GroupAccess): boolean {
  return activeRole(access) === "owner";
}

/**
 * A public group is readable by every community member; a private one by its
 * members only. An archived group is closed to everyone except admins.
 */
export function canViewGroupContent(
  access: GroupAccess,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (access.status !== "active") return false;
  return access.privacy === "public" || isGroupMember(access);
}

/** Posting and commenting need membership, even in a public group. */
export function canPostInGroup(access: GroupAccess): boolean {
  return access.status === "active" && isGroupMember(access);
}

/** Pin, hide, approve requests and manage members: the group's managers, or an admin. */
export function canModerateGroup(access: GroupAccess, isAdmin: boolean): boolean {
  return isAdmin || (access.status === "active" && managesGroup(access));
}

export type GroupJoinDecision =
  | { action: "join" }
  | { action: "request" }
  | { action: "none"; reason: "member" | "pending" | "banned" | "archived" };

/** Public groups admit at once; private groups take a request for a manager to approve. */
export function evaluateGroupJoin(access: GroupAccess): GroupJoinDecision {
  if (access.status !== "active") return { action: "none", reason: "archived" };
  const status = access.membership?.status;
  if (status === "active") return { action: "none", reason: "member" };
  if (status === "pending") return { action: "none", reason: "pending" };
  if (status === "banned") return { action: "none", reason: "banned" };
  return access.privacy === "public" ? { action: "join" } : { action: "request" };
}

export function groupJoinBlockCopy(
  reason: "member" | "pending" | "banned" | "archived",
): string {
  switch (reason) {
    case "member":
      return "You are already in this group.";
    case "pending":
      return "Your request to join is waiting for approval.";
    case "banned":
      return "You can't join this group.";
    case "archived":
      return "This group is closed.";
  }
}

/**
 * Whether someone may remove a member or change their role. Nobody manages
 * the owner; a moderator manages ordinary members only.
 */
export function canManageGroupMember(
  actorRole: GroupRole | null,
  targetRole: GroupRole,
  isAdmin: boolean,
): boolean {
  if (targetRole === "owner") return false;
  if (isAdmin || actorRole === "owner") return true;
  return actorRole === "moderator" && targetRole === "member";
}
