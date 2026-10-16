import { createHash, randomBytes } from "node:crypto";

import type { AppRole, StaffInviteRole } from "@/lib/app-role";

export const STAFF_INVITE_TOKEN_BYTES = 32;
export const STAFF_INVITE_EXPIRY_DAYS = 7;

export function isStaffInviteRole(role: AppRole | string): role is StaffInviteRole {
  return role === "admin" || role === "instructor";
}

export function createStaffInviteToken() {
  return randomBytes(STAFF_INVITE_TOKEN_BYTES).toString("base64url");
}

export function hashStaffInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getStaffInviteExpiry(now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + STAFF_INVITE_EXPIRY_DAYS);
  return expiresAt;
}

export function buildStaffInviteUrl(baseUrl: string | undefined, token: string) {
  const origin = baseUrl?.trim().replace(/\/+$/, "") || "http://localhost:3000";
  return `${origin}/admin/invite/${encodeURIComponent(token)}`;
}

export function getStaffInviteStatus(input: {
  acceptedAt: Date | string | null;
  revokedAt: Date | string | null;
  expiresAt: Date | string;
  now?: Date | string;
}) {
  if (input.acceptedAt) {
    return "accepted" as const;
  }

  if (input.revokedAt) {
    return "revoked" as const;
  }

  const expiresAt = new Date(input.expiresAt);
  const now = input.now ? new Date(input.now) : new Date();

  if (expiresAt.getTime() <= now.getTime()) {
    return "expired" as const;
  }

  return "pending" as const;
}

