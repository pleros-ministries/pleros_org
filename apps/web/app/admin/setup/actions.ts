"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  ensureAppUserRecord,
  getMissingSuperAdminEmails,
  isConfiguredSuperAdminEmail,
} from "@/lib/app-user";
import {
  consumeSuperAdminSetupClaim,
  createSuperAdminSetupClaim,
  getSuperAdminSetupClaimByToken,
  revokePendingSuperAdminSetupClaims,
} from "@/lib/db/queries/super-admin-setup";
import { isEmailEnabled } from "@/lib/email/resend";
import { sendSuperAdminSetup } from "@/lib/email/send";
import {
  buildSuperAdminSetupUrl,
  createSuperAdminSetupToken,
  getSuperAdminSetupClaimStatus,
  getSuperAdminSetupExpiry,
  hashSuperAdminSetupToken,
} from "@/lib/super-admin-setup";

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

export type SuperAdminPasswordSetupState = {
  status: "idle" | "error";
  message: string;
  errors: {
    password?: string;
    confirmPassword?: string;
  };
};

function normalizeFormValue(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function normalizeEmail(value: FormDataEntryValue | null): string {
  return normalizeFormValue(value).toLowerCase();
}

function resolveRequestBaseUrl(headerStore: Headers) {
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL;
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

  if (!isEmailEnabled()) {
    return {
      status: "error",
      message:
        "Email delivery must be configured before creating a super admin account.",
      values,
      errors: {},
    };
  }

  try {
    const headerStore = await headers();
    const token = createSuperAdminSetupToken();
    const setupUrl = buildSuperAdminSetupUrl(
      resolveRequestBaseUrl(headerStore),
      token,
    );

    await revokePendingSuperAdminSetupClaims(email);
    await createSuperAdminSetupClaim({
      email,
      name,
      tokenHash: hashSuperAdminSetupToken(token),
      expiresAt: getSuperAdminSetupExpiry(),
    });

    const sendResult = await sendSuperAdminSetup({
      to: email,
      name,
      setupUrl,
    });

    if (!sendResult) {
      throw new Error("Email delivery is unavailable.");
    }

    return {
      status: "success",
      message: "Setup link sent. Open the link to set your password.",
      values,
      errors: {},
    };
  } catch {
    return {
      status: "error",
      message:
        "Setup email could not be sent. Check email configuration and try again.",
      values,
      errors: {},
    };
  }
}

export async function completeSuperAdminSetupAction(
  _previousState: SuperAdminPasswordSetupState,
  formData: FormData,
): Promise<SuperAdminPasswordSetupState> {
  const token = normalizeFormValue(formData.get("token"));
  const password = normalizeFormValue(formData.get("password"));
  const confirmPassword = normalizeFormValue(formData.get("confirmPassword"));

  if (!token) {
    return {
      status: "error",
      message: "Setup link is invalid.",
      errors: {},
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "Password must be at least 8 characters.",
      errors: { password: "Password must be at least 8 characters." },
    };
  }

  if (password.length > 128) {
    return {
      status: "error",
      message: "Password must be 128 characters or fewer.",
      errors: { password: "Password must be 128 characters or fewer." },
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
      errors: { confirmPassword: "Passwords do not match." },
    };
  }

  const claim = await getSuperAdminSetupClaimByToken(token);
  const status = claim ? getSuperAdminSetupClaimStatus(claim) : null;

  if (!claim || status !== "pending") {
    return {
      status: "error",
      message: `Setup link is ${status ?? "invalid"}. Request a new setup email.`,
      errors: {},
    };
  }

  if (!isConfiguredSuperAdminEmail(claim.email)) {
    return {
      status: "error",
      message: "This email is not eligible for super admin setup.",
      errors: {},
    };
  }

  const missingSuperAdminEmails = await getMissingSuperAdminEmails();
  if (!missingSuperAdminEmails.some((email) => email === claim.email)) {
    await consumeSuperAdminSetupClaim(claim.id);
    return {
      status: "error",
      message: "This super admin account has already been created.",
      errors: {},
    };
  }

  try {
    const authContext = await betterAuthServer.$context;
    const passwordHash = await authContext.password.hash(password);
    const existingAuthUser = await authContext.internalAdapter.findUserByEmail(
      claim.email,
      { includeAccounts: true },
    );

    const authUser = existingAuthUser
      ? await authContext.internalAdapter.updateUser(existingAuthUser.user.id, {
          name: claim.name,
          emailVerified: true,
        })
      : await authContext.internalAdapter.createUser({
          name: claim.name,
          email: claim.email,
          emailVerified: true,
        });

    const accounts =
      existingAuthUser?.accounts ??
      (await authContext.internalAdapter.findAccounts(authUser.id));
    const hasCredentialAccount = accounts.some(
      (account) => account.providerId === "credential",
    );

    if (hasCredentialAccount) {
      await authContext.internalAdapter.updatePassword(authUser.id, passwordHash);
    } else {
      await authContext.internalAdapter.linkAccount({
        userId: authUser.id,
        providerId: "credential",
        accountId: authUser.id,
        password: passwordHash,
      });
    }

    await ensureAppUserRecord({
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: "super_admin",
      emailVerified: true,
    });

    await consumeSuperAdminSetupClaim(claim.id);
    revalidatePath("/admin", "layout");

    await betterAuthServer.api.signInEmail({
      headers: await headers(),
      body: {
        email: claim.email,
        password,
      },
    });
  } catch {
    return {
      status: "error",
      message: "Password could not be saved. Try the setup link again.",
      errors: {},
    };
  }

  redirect("/admin");
}
