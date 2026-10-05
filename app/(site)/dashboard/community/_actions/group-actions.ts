"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import type { CommunityContext } from "@/lib/community/context";
import {
  CommunityError,
  POSTING_PAUSED_COPY,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  canManageGroupMember,
  canModerateGroup,
  evaluateGroupJoin,
  groupJoinBlockCopy,
  normaliseGroupInput,
  ownsGroup,
} from "@/lib/community/groups";
import {
  notifyGroupJoinApproved,
  notifyGroupJoinRequest,
} from "@/lib/community/notify";
import { RateLimitError } from "@/lib/community/rate-limit";
import { firstNameOf } from "@/lib/community/visibility";
import {
  addGroupMember,
  approveAllGroupRequests,
  approveGroupRequest,
  banGroupMember,
  createGroup,
  deleteGroupMembership,
  getGroupAccess,
  getGroupMembership,
  getGroupName,
  listGroupManagerUserIds,
  removeOwnMembership,
  setGroupMemberRole,
  setGroupStatus,
  updateGroup,
} from "@/lib/db/queries/community-groups";

const GROUP_GONE = "This group is no longer available.";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Returns expected failures as data; thrown messages are hidden in production. */
async function run<T extends object>(
  fn: () => Promise<T>,
): Promise<CommunityActionResult<T>> {
  try {
    return { ok: true as const, ...(await fn()) };
  } catch (error) {
    if (error instanceof CommunityError || error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function revalidateGroup(groupId: number) {
  revalidatePath("/dashboard/community/groups");
  revalidatePath(`/dashboard/community/groups/${groupId}`);
  revalidatePath("/admin/community");
}

// ─── Creating and editing ──────────────────────────────────────────────────

/** Any community member can start a group; it is live at once with them as owner. */
export async function createCommunityGroup(input: {
  name: string;
  description: string;
  privacy: string;
}): Promise<CommunityActionResult<{ id: number }>> {
  return run(async () => {
    const ctx = await requireCommunity();
    if (ctx.postingBlocked) throw new CommunityError(POSTING_PAUSED_COPY);

    const parsed = normaliseGroupInput(input);
    if (!parsed.ok) throw new CommunityError(parsed.error);

    const group = await createGroup(ctx.userId, parsed.value);
    revalidateGroup(group.id);
    return { id: group.id };
  });
}

/** The owner (or an admin) changes a group's name, description or privacy. */
export async function updateCommunityGroup(input: {
  groupId: number;
  name: string;
  description: string;
  privacy: string;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const access = await getGroupAccess(ctx.userId, input.groupId);
    if (!access) throw new CommunityError(GROUP_GONE);
    if (!ctx.isAdmin && !ownsGroup(access)) {
      throw new CommunityError("Only the group's owner can change its details.");
    }

    const parsed = normaliseGroupInput(input);
    if (!parsed.ok) throw new CommunityError(parsed.error);

    await updateGroup(input.groupId, parsed.value);
    // Opening a private group admits everyone who was waiting.
    if (access.privacy === "private" && parsed.value.privacy === "public") {
      await approveAllGroupRequests(input.groupId);
    }
    revalidateGroup(input.groupId);
    return {};
  });
}

/** The owner (or an admin) closes a group, or reopens it. */
export async function setCommunityGroupArchived(input: {
  groupId: number;
  archived: boolean;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const access = await getGroupAccess(ctx.userId, input.groupId);
    if (!access) throw new CommunityError(GROUP_GONE);
    if (!ctx.isAdmin && !ownsGroup(access)) {
      throw new CommunityError("Only the group's owner can close it.");
    }
    await setGroupStatus(input.groupId, input.archived ? "archived" : "active");
    revalidateGroup(input.groupId);
    return {};
  });
}

// ─── Joining and leaving ───────────────────────────────────────────────────

/** Joins a public group at once, or asks to join a private one. */
export async function joinCommunityGroup(
  groupId: number,
): Promise<CommunityActionResult<{ outcome: "joined" | "requested" }>> {
  return run(async () => {
    const ctx = await requireCommunity();
    const access = await getGroupAccess(ctx.userId, groupId);
    if (!access) throw new CommunityError(GROUP_GONE);

    const decision = evaluateGroupJoin(access);
    if (decision.action === "none") {
      throw new CommunityError(groupJoinBlockCopy(decision.reason));
    }

    const requested = decision.action === "request";
    await addGroupMember({
      groupId,
      userId: ctx.userId,
      status: requested ? "pending" : "active",
    });

    if (requested) {
      const session = await getAppSession();
      const requesterFirstName = firstNameOf(session?.user.name ?? "Someone");
      after(() =>
        (async () => {
          const [groupName, managerUserIds] = await Promise.all([
            getGroupName(groupId),
            listGroupManagerUserIds(groupId),
          ]);
          await notifyGroupJoinRequest({
            groupId,
            groupName: groupName ?? "your group",
            managerUserIds,
            requesterUserId: ctx.userId,
            requesterFirstName,
          });
        })().catch((error) =>
          console.error("Group join-request notification failed:", error),
        ),
      );
    }

    revalidateGroup(groupId);
    return { outcome: requested ? ("requested" as const) : ("joined" as const) };
  });
}

/** Leaves a group, or withdraws a request to join. */
export async function leaveCommunityGroup(
  groupId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const access = await getGroupAccess(ctx.userId, groupId);
    if (!access?.membership) throw new CommunityError(GROUP_GONE);
    if (ownsGroup(access)) {
      throw new CommunityError(
        "You own this group, so you can't leave it. Close the group instead.",
      );
    }
    await removeOwnMembership(groupId, ctx.userId);
    revalidateGroup(groupId);
    return {};
  });
}

// ─── Managing members ──────────────────────────────────────────────────────

/** A manager approves or declines a request to join a private group. */
export async function respondToGroupRequest(input: {
  memberId: number;
  approve: boolean;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const target = await getGroupMembership(input.memberId);
    if (!target || target.status !== "pending") {
      throw new CommunityError("That request is no longer waiting.");
    }
    const access = await getGroupAccess(ctx.userId, target.groupId);
    if (!access || !canModerateGroup(access, ctx.isAdmin)) {
      throw new Error("Forbidden");
    }

    if (input.approve) {
      await approveGroupRequest(target.id);
      after(() =>
        (async () => {
          const groupName = await getGroupName(target.groupId);
          await notifyGroupJoinApproved({
            groupId: target.groupId,
            groupName: groupName ?? "the group",
            userId: target.userId,
          });
        })().catch((error) =>
          console.error("Group approval notification failed:", error),
        ),
      );
    } else {
      await deleteGroupMembership(target.id);
    }
    revalidateGroup(target.groupId);
    return {};
  });
}

/** A manager removes a member; `block` also stops them rejoining. */
export async function removeGroupMember(input: {
  memberId: number;
  block: boolean;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const target = await getGroupMembership(input.memberId);
    if (!target || target.status !== "active") {
      throw new CommunityError("That person is no longer in the group.");
    }
    const access = await getGroupAccess(ctx.userId, target.groupId);
    const actorRole =
      access?.membership?.status === "active" ? access.membership.role : null;
    if (
      !access ||
      target.userId === ctx.userId ||
      !canModerateGroup(access, ctx.isAdmin) ||
      !canManageGroupMember(actorRole, target.role, ctx.isAdmin)
    ) {
      throw new Error("Forbidden");
    }

    if (input.block) await banGroupMember(target.id);
    else await deleteGroupMembership(target.id);
    revalidateGroup(target.groupId);
    return {};
  });
}

/** The owner (or an admin) makes a member a moderator, or an ordinary member again. */
export async function setGroupMemberModerator(input: {
  memberId: number;
  moderator: boolean;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const target = await getGroupMembership(input.memberId);
    if (!target || target.status !== "active" || target.role === "owner") {
      throw new CommunityError("That person's role can't be changed.");
    }
    const access = await getGroupAccess(ctx.userId, target.groupId);
    if (!access || !(ctx.isAdmin || ownsGroup(access))) {
      throw new CommunityError("Only the group's owner can choose moderators.");
    }
    await setGroupMemberRole(target.id, input.moderator ? "moderator" : "member");
    revalidateGroup(target.groupId);
    return {};
  });
}
