import { createHmac, randomBytes } from "node:crypto";

export const SOGP_SETUP_COOKIE = "pleros_sogp_setup_v1";
export const SOGP_SETUP_TTL_SECONDS = 30 * 60;
export const SOGP_OTP_TTL_SECONDS = 10 * 60;
export const SOGP_OTP_RESEND_SECONDS = 60;
export const SOGP_OTP_MAX_SENDS = 5;

export function getSogpFlowSecret(env: NodeJS.ProcessEnv): string {
  return (
    env.BETTER_AUTH_SECRET ??
    "demo-only-better-auth-secret-change-in-production-12345"
  );
}

export function getSogpSetupCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SOGP_SETUP_TTL_SECONDS,
  };
}

export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

export function normalizeLearnerReturnTo(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  const candidate = value?.trim();

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("%")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://pleros.local");
    const isDashboardPath =
      parsed.pathname === "/dashboard" ||
      parsed.pathname.startsWith("/dashboard/");

    if (parsed.origin !== "https://pleros.local" || !isDashboardPath) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

export function createSogpFlowToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSogpFlowToken(token: string, secret: string): string {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function validateLearnerPassword(
  password: string,
  confirmation: string,
): Record<string, string> {
  if (password.length < 8) {
    return { password: "Password must be at least 8 characters." };
  }

  if (password.length > 128) {
    return { password: "Password must be 128 characters or fewer." };
  }

  if (password !== confirmation) {
    return { confirmation: "Passwords do not match." };
  }

  return {};
}

export function canSendSogpCode(
  input: { sentAt: Date | null; sendCount: number },
  now = new Date(),
): boolean {
  if (input.sendCount >= SOGP_OTP_MAX_SENDS) {
    return false;
  }

  if (!input.sentAt) {
    return true;
  }

  return now.getTime() - input.sentAt.getTime() >= SOGP_OTP_RESEND_SECONDS * 1000;
}

export function isSogpSetupExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
