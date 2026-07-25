"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";

import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  ensureAppUserRecord,
  getMissingSuperAdminEmails,
  isConfiguredSuperAdminEmail,
} from "@/lib/app-user";
import { isEmailEnabled } from "@/lib/email/resend";

export type SuperAdminSetupState = {
  status: "idle" | "success" | "error";
  message: string;
  values: {
    name: string;
    email: string;
  };
  errors: {
    name?: string;
    email?: string;
  };
};

function normalizeFormValue(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: FormDataEntryValue | null): string {
  return normalizeFormValue(value).toLowerCase();
}

export async function createSuperAdminAccountAction(
  _previousState: SuperAdminSetupState,
  formData: FormData,
): Promise<SuperAdminSetupState> {
  const name = normalizeFormValue(formData.get("name"));
  const email = normalizeEmail(formData.get("email"));
  const values = { name, email };

  if (!name) {
    return {
      status: "error",
      message: "Enter a display name.",
      values,
      errors: { name: "Enter a display name." },
    };
  }

  if (!email || !email.includes("@")) {
    return {
      status: "error",
      message: "Enter a valid email address.",
      values,
      errors: { email: "Enter a valid email address." },
    };
  }

  if (!isConfiguredSuperAdminEmail(email)) {
    return {
      status: "error",
      message: "This email is not eligible for super admin setup.",
      values,
      errors: { email: "Use a configured super admin email." },
    };
  }

  const missingSuperAdminEmails = await getMissingSuperAdminEmails();
  if (!missingSuperAdminEmails.some((missingEmail) => missingEmail === email)) {
    return {
      status: "error",
      message: "This super admin account has already been created.",
      values,
      errors: { email: "This super admin account has already been created." },
    };
  }

  if (process.env.NODE_ENV === "production" && !isEmailEnabled()) {
    return {
      status: "error",
      message:
        "Email delivery must be configured before creating a production super admin account.",
      values,
      errors: {},
    };
  }

  try {
    const signUpResult = await betterAuthServer.api.signUpEmail({
      headers: await headers(),
      body: {
        name,
        email,
        callbackURL: "/admin/forgot-password?setup=super-admin",
        password: randomBytes(48).toString("base64url"),
      },
    });

    await ensureAppUserRecord({
      id: signUpResult.user.id,
      name: signUpResult.user.name,
      email: signUpResult.user.email,
      role: "super_admin",
      emailVerified: Boolean(signUpResult.user.emailVerified),
    });

    return {
      status: "success",
      message:
        "Verification sent. Check that inbox, verify the email, then set your admin password.",
      values,
      errors: {},
    };
  } catch {
    return {
      status: "error",
      message:
        "Account setup failed. If this email already has an account, verify it and sign in instead.",
      values,
      errors: {},
    };
  }
}
