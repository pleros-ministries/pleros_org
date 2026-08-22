"use server";

import { headers } from "next/headers";

import { betterAuthServer } from "@/lib/auth/better-auth";
import { resolveAuthBaseUrl } from "@/lib/auth/auth-env";
import {
  PASSWORD_RESET_SUCCESS_MESSAGE,
  type PasswordResetRequestState,
  type PasswordResetState,
} from "@/lib/ppc-password-reset";

function normalizeEmail(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resolveRequestOrigin(headerStore: Headers): string {
  const forwardedHost = headerStore.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || headerStore.get("host");
  const forwardedProto = headerStore
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();

  if (host) {
    const protocol =
      forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");

    return `${protocol}://${host}`;
  }

  return resolveAuthBaseUrl(process.env) ?? "http://localhost:3000";
}

function resolveResetRedirectPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? "").trim();

  if (path === "/admin/reset-password") {
    return path;
  }

  return "/ppc/reset-password";
}

export async function requestPpcPasswordResetAction(
  _previousState: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const email = normalizeEmail(formData.get("email"));
  const resetRedirectPath = resolveResetRedirectPath(formData.get("resetRedirectPath"));

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      values: { email },
      errors: {
        email: "Enter a valid email address.",
      },
    };
  }

  const headerStore = await headers();
  const origin = resolveRequestOrigin(headerStore);

  try {
    await betterAuthServer.api.requestPasswordReset({
      headers: headerStore,
      body: {
        email,
        redirectTo: `${origin}${resetRedirectPath}`,
      },
    });
  } catch {
    return {
      status: "error",
      message: "Password reset is unavailable right now. Try again shortly.",
      values: { email },
      errors: {},
    };
  }

  return {
    status: "success",
    message: PASSWORD_RESET_SUCCESS_MESSAGE,
    values: { email },
    errors: {},
  };
}

export async function resetPpcPasswordAction(
  _previousState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return {
      status: "error",
      message: "This reset link is invalid or expired.",
      errors: {
        token: "Missing reset token.",
      },
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
      errors: {
        password: "Password must be at least 8 characters.",
      },
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
      errors: {
        password: "Passwords do not match.",
      },
    };
  }

  try {
    await betterAuthServer.api.resetPassword({
      headers: await headers(),
      body: {
        token,
        newPassword: password,
      },
    });
  } catch {
    return {
      status: "error",
      message: "This reset link is invalid or expired.",
      errors: {
        token: "Invalid reset token.",
      },
    };
  }

  return {
    status: "success",
    message: "Password updated. You can now log in with your new password.",
    errors: {},
  };
}
