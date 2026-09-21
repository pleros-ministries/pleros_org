"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requireAdmin } from "@/lib/auth/require-role";
import { getAppRoleLabel } from "@/lib/app-role";
import {
  acceptStaffInvite,
  createStaffInvite,
  getAuthUserByEmail,
  getStaffInviteByToken,
  revokeStaffInvite,
  setUserStaffRole,
} from "@/lib/db/queries/staff-invites";
import {
  setAdminPastorFlag,
  unassignAllForPastor,
} from "@/lib/db/queries/pastor-followups";
import { sendStaffAssignmentNotification, sendStaffInvite } from "@/lib/email/send";
import {
  ensureAppUserRecord,
  getAppUserById,
  isConfiguredSuperAdminEmail,
  searchAppUsers,
} from "@/lib/app-user";
import {
  buildStaffInviteUrl,
  createStaffInviteToken,
  getStaffInviteExpiry,
  getStaffInviteStatus,
  hashStaffInviteToken,
  isStaffInviteRole,
} from "@/lib/staff-invites";

// Next.js treats a `throw` from a Server Action as an uncaught exception: in
// production the message is redacted to a generic one (the "digest" error /
// React error #441), even for a deliberate, safe validation message. Every
// action below returns `{ error: string }` for expected failures instead, so
// the real message actually reaches the admin. See
// https://nextjs.org/docs/app/getting-started/error-handling — auth-gate
// calls like `requireAdmin()` are left as throws on purpose: those mean
// "you shouldn't be able to call this at all," not a normal validation case.

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
  const session = await requireAdmin();
  const email = normalizeEmail(data.email);

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid staff email." };
  }

  if (!isStaffInviteRole(data.role)) {
    return { error: "Staff invites can only be for admins, instructors, or pastors." };
  }

  const existingAuthUser = await getAuthUserByEmail(email);
  if (existingAuthUser) {
    return {
      error:
        'An account already exists for this email — use "Grant access to an existing account" below instead of an invite.',
    };
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
    error: null as string | null,
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
    inviteUrl,
    emailSent: Boolean(sendResult),
  };
}

export async function acceptStaffInviteAction(data: { token: string }) {
  const invite = await getStaffInviteByToken(data.token);

  if (!invite) {
    return { error: "Invite not found." };
  }

  const status = getStaffInviteStatus(invite);
  if (status !== "pending") {
    return { error: `Invite is ${status}.` };
  }

  if (!isStaffInviteRole(invite.role)) {
    return { error: "Invite role is invalid." };
  }

  const authUser = await getAuthUserByEmail(invite.email);
  if (!authUser) {
    return { error: "Create your account before accepting this invite." };
  }

  if (!authUser.emailVerified) {
    return { error: "Verify your email before accepting this staff invite." };
  }

  const userId = await ensureAppUserRecord({
    id: authUser.id,
    name: authUser.name,
    email: authUser.email,
    role: invite.role,
    emailVerified: true,
  });

  await acceptStaffInvite(invite.id, userId);
  revalidateStaffSurfaces();

  return {
    error: null as string | null,
    success: true,
    redirectTo: "/admin",
  };
}

export async function revokeStaffInviteAction(inviteId: number) {
  await requireAdmin();
  const invite = await revokeStaffInvite(inviteId);
  revalidateStaffSurfaces();

  return {
    id: invite.id,
    status: getStaffInviteStatus(invite),
  };
}

/** Search registered accounts by name or email — for picking who to grant
 * staff/pastor access to, without needing to know their exact email. */
export async function searchStaffCandidatesAction(query: string) {
  await requireAdmin();
  if (!query.trim()) return [];
  return searchAppUsers(query, 8);
}

/**
 * Grant staff access to an ALREADY-registered account directly, bypassing
 * the invite-token/sign-up flow entirely. That flow only works for brand-new
 * accounts — better-auth silently no-ops `signUp.email()` against an email
 * that already exists, so anyone who registered before being made staff
 * (e.g. via the public SOGP enrolment form) can never complete an invite.
 */
export async function grantExistingUserStaffRole(input: {
  userId: string;
  role: string;
}) {
  await requireAdmin();

  if (!isStaffInviteRole(input.role)) {
    return { error: "Choose admin, instructor, or pastor." };
  }

  const user = await getAppUserById(input.userId);
  if (!user) {
    return { error: "That account no longer exists." };
  }

  // Emails in SUPER_ADMIN_EMAILS have their `role` pinned to "super_admin" on
  // every session load (see lib/app-session.ts / ensureAppUserRecord) so
  // they can never be locked out — any other role written to `users.role`
  // for them gets silently reverted within moments. Pastor access for such
  // an account has to go through the same `isPastor` flag the "Also a
  // pastor" admin toggle uses, which that pinning never touches.
  const isFixedSuperAdmin = isConfiguredSuperAdminEmail(user.email);
  if (isFixedSuperAdmin && input.role !== "pastor") {
    return {
      error: `${user.name} is a permanent super admin and already has full access — there's nothing to grant.`,
    };
  }

  if (isFixedSuperAdmin) {
    await setAdminPastorFlag(user.id, true);
  } else {
    await setUserStaffRole(user.id, input.role);
  }

  // Same origin-normalization `buildStaffInviteUrl` uses, minus the
  // invite-token path segment — this links straight to the admin login.
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:3000";
  after(() =>
    sendStaffAssignmentNotification({
      to: user.email,
      staffName: user.name,
      subject: `You now have ${getAppRoleLabel(input.role)} access`,
      itemLabel: `Your account has been granted ${getAppRoleLabel(input.role)} access on Pleros admin.`,
      detail: user.emailVerified
        ? "Log in with your existing password to get started."
        : "You'll need to verify your email before this takes effect — check your inbox for a verification link.",
      url: `${origin}/admin`,
      ctaLabel: "Log in",
    }).catch((error) => console.error("Staff assignment email failed:", error)),
  );

  revalidateStaffSurfaces();

  return { error: null as string | null, granted: true, emailVerified: user.emailVerified };
}

/** Remove someone's pastor (or other staff) access — reverts to "student". */
export async function removeStaffRole(input: { userId: string }) {
  await requireAdmin();
  await setUserStaffRole(input.userId, "student");
  await unassignAllForPastor(input.userId);
  revalidateStaffSurfaces();
}
