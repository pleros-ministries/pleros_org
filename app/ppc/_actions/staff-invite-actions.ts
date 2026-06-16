"use server";

import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/require-role";
import {
  acceptStaffInvite,
  createStaffInvite,
  getAuthUserByEmail,
  getStaffInviteByToken,
  revokeStaffInvite,
} from "@/lib/db/queries/staff-invites";
import { sendStaffInvite } from "@/lib/email/send";
import { ensureAppUserRecord } from "@/lib/app-user";
import {
  buildStaffInviteUrl,
  createStaffInviteToken,
  getStaffInviteExpiry,
  getStaffInviteStatus,
  hashStaffInviteToken,
  isStaffInviteRole,
} from "@/lib/staff-invites";

function revalidateStaffSurfaces() {
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/staff");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createStaffInviteAction(data: {
  email: string;
  role: string;
}) {
  const session = await requireSuperAdmin();
  const email = normalizeEmail(data.email);

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid staff email.");
  }

  if (!isStaffInviteRole(data.role)) {
    throw new Error("Staff invites can only be for admins or instructors.");
  }

  const token = createStaffInviteToken();
  const inviteUrl = buildStaffInviteUrl(process.env.NEXT_PUBLIC_APP_URL, token);
  const invite = await createStaffInvite({
    email,
    role: data.role,
    tokenHash: hashStaffInviteToken(token),
    invitedBy: session.user.id,
    expiresAt: getStaffInviteExpiry(),
  });

  const sendResult = await sendStaffInvite({
    to: email,
    role: data.role,
    inviteUrl,
  });

  revalidateStaffSurfaces();

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
    inviteUrl,
    emailSent: Boolean(sendResult),
  };
}

export async function acceptStaffInviteAction(data: {
  token: string;
}) {
  const invite = await getStaffInviteByToken(data.token);

  if (!invite) {
    throw new Error("Invite not found.");
  }

  const status = getStaffInviteStatus(invite);
  if (status !== "pending") {
    throw new Error(`Invite is ${status}.`);
  }

  if (!isStaffInviteRole(invite.role)) {
    throw new Error("Invite role is invalid.");
  }

  const authUser = await getAuthUserByEmail(invite.email);
  if (!authUser) {
    throw new Error("Create your account before accepting this invite.");
  }

  const userId = await ensureAppUserRecord({
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    role: invite.role,
  });

  await acceptStaffInvite(invite.id, userId);
  revalidateStaffSurfaces();

  return {
    success: true,
    redirectTo: "/admin",
  };
}

export async function revokeStaffInviteAction(inviteId: number) {
  await requireSuperAdmin();
  const invite = await revokeStaffInvite(inviteId);
  revalidateStaffSurfaces();

  return {
    id: invite.id,
    status: getStaffInviteStatus(invite),
  };
}

