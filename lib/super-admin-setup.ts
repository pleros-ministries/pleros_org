import { createHash, randomBytes } from "node:crypto";

export const SUPER_ADMIN_SETUP_TOKEN_BYTES = 32;
export const SUPER_ADMIN_SETUP_EXPIRY_HOURS = 1;

export function createSuperAdminSetupToken() {
  return randomBytes(SUPER_ADMIN_SETUP_TOKEN_BYTES).toString("base64url");
}

export function hashSuperAdminSetupToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getSuperAdminSetupExpiry(now = new Date()) {
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + SUPER_ADMIN_SETUP_EXPIRY_HOURS);
  return expiresAt;
}

export function buildSuperAdminSetupUrl(
  baseUrl: string | undefined,
  token: string,
) {
  const origin = baseUrl?.trim().replace(/\/+$/, "") || "http://localhost:3000";
  return `${origin}/admin/setup/claim/${encodeURIComponent(token)}`;
}

export function getSuperAdminSetupClaimStatus(input: {
  consumedAt: Date | string | null;
  expiresAt: Date | string;
  now?: Date | string;
}) {
  if (input.consumedAt) {
    return "consumed" as const;
  }

  const expiresAt = new Date(input.expiresAt);
  const now = input.now ? new Date(input.now) : new Date();

  if (expiresAt.getTime() <= now.getTime()) {
    return "expired" as const;
  }

  return "pending" as const;
}
