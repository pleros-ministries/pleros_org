import { randomBytes } from "node:crypto";

export type SogpOtpPurpose = "email_verification" | "sign_in";

export function getSogpOtpPurpose(
  user: { emailVerified: boolean } | null,
): SogpOtpPurpose {
  return user?.emailVerified ? "sign_in" : "email_verification";
}

type SetupCompletionInput = {
  email: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  completedAt: Date | null;
};

export function validateSogpSetupCompletion(
  pending: SetupCompletionInput,
  sessionEmail: string,
  now = new Date(),
):
  | { ok: true }
  | {
      ok: false;
      reason: "email_mismatch" | "not_verified" | "expired" | "completed";
    } {
  if (pending.completedAt) {
    return { ok: false, reason: "completed" };
  }

  if (pending.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, reason: "expired" };
  }

  if (!pending.verifiedAt) {
    return { ok: false, reason: "not_verified" };
  }

  if (pending.email.toLowerCase() !== sessionEmail.trim().toLowerCase()) {
    return { ok: false, reason: "email_mismatch" };
  }

  return { ok: true };
}

export async function ensureSogpAuthUser(input: {
  email: string;
  name: string;
}) {
  const { betterAuthServer } = await import("@/lib/auth/better-auth");
  const authContext = await betterAuthServer.$context;
  const email = input.email.trim().toLowerCase();
  const existing = await authContext.internalAdapter.findUserByEmail(email, {
    includeAccounts: true,
  });

  if (existing?.user) {
    return existing.user;
  }

  const temporaryPassword = randomBytes(48).toString("base64url");
  const passwordHash = await authContext.password.hash(temporaryPassword);

  try {
    const user = await authContext.internalAdapter.createUser({
      email,
      name: input.name,
      emailVerified: false,
    });
    await authContext.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: passwordHash,
    });
    return user;
  } catch (error) {
    const raced = await authContext.internalAdapter.findUserByEmail(email);
    if (raced?.user) return raced.user;
    throw error;
  }
}

export async function replaceSogpCredentialPassword(
  authUserId: string,
  password: string,
) {
  const { betterAuthServer } = await import("@/lib/auth/better-auth");
  const authContext = await betterAuthServer.$context;
  const passwordHash = await authContext.password.hash(password);
  const accounts = await authContext.internalAdapter.findAccounts(authUserId);
  const hasCredential = accounts.some(
    (account) => account.providerId === "credential",
  );

  if (hasCredential) {
    await authContext.internalAdapter.updatePassword(authUserId, passwordHash);
  } else {
    await authContext.internalAdapter.linkAccount({
      userId: authUserId,
      providerId: "credential",
      accountId: authUserId,
      password: passwordHash,
    });
  }
}
