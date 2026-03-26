import { createHmac } from "node:crypto";
import { cookies } from "next/headers";

import { getWelcomeAccessSecret } from "./welcome-access";
import { normalizeEmail } from "./welcome-flow";

const DEFAULT_WELCOME_RETURN_TO = "/dashboard";

export function normalizeWelcomeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_WELCOME_RETURN_TO,
): string {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function buildWelcomeAuthPassword(email: string, secret: string): string {
  const normalizedEmail = normalizeEmail(email);
  const signature = createHmac("sha256", secret)
    .update(normalizedEmail)
    .digest("base64url");

  return `pleros.${signature}`;
}

function signBetterAuthCookieValue(value: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(value).digest("base64");
  return `${value}.${signature}`;
}

async function createSessionForExistingAuthUser(opts: {
  authContext: Awaited<{
    secret: string;
    authCookies: {
      sessionToken: {
        name: string;
        attributes: {
          httpOnly?: boolean;
          sameSite?: string;
          secure?: boolean;
          path?: string;
          maxAge?: number;
          domain?: string;
        };
      };
    };
    internalAdapter: {
      findUserByEmail: (
        email: string,
      ) => Promise<{ user: { id: string; name: string; email: string } } | null>;
      createSession: (
        userId: string,
      ) => Promise<{ token: string }>;
    };
  }>;
  email: string;
  ensureAppUserRecord: (opts: {
    id: string;
    name: string;
    email: string;
  }) => Promise<string>;
}) {
  const existing = await opts.authContext.internalAdapter.findUserByEmail(opts.email);

  if (!existing?.user) {
    return null;
  }

  const session = await opts.authContext.internalAdapter.createSession(
    existing.user.id,
  );
  const cookieStore = await cookies();
  const signedToken = signBetterAuthCookieValue(
    session.token,
    opts.authContext.secret,
  );
  const rawSameSite = opts.authContext.authCookies.sessionToken.attributes.sameSite;
  const normalizedSameSite =
    typeof rawSameSite === "string"
      ? rawSameSite.toLowerCase() === "strict"
        ? "strict"
        : rawSameSite.toLowerCase() === "none"
          ? "none"
          : "lax"
      : undefined;

  cookieStore.set(
    opts.authContext.authCookies.sessionToken.name,
    signedToken,
    {
      ...opts.authContext.authCookies.sessionToken.attributes,
      sameSite: normalizedSameSite,
    },
  );

  await opts.ensureAppUserRecord({
    id: existing.user.id,
    name: existing.user.name,
    email: existing.user.email,
  });

  return existing.user;
}

export async function provisionWelcomeSession(opts: {
  email: string;
  name: string;
  requestHeaders?: HeadersInit;
}) {
  const [{ ensureAppUserRecord }, { betterAuthServer }] = await Promise.all([
    import("./app-user"),
    import("./auth/better-auth"),
  ]);
  const authContext = await betterAuthServer.$context;
  const email = normalizeEmail(opts.email);
  const password = buildWelcomeAuthPassword(
    email,
    getWelcomeAccessSecret(process.env),
  );

  const headers = opts.requestHeaders ? new Headers(opts.requestHeaders) : undefined;

  try {
    const signUpResult = await betterAuthServer.api.signUpEmail({
      headers,
      body: {
        email,
        name: opts.name,
        password,
      },
    });

    await ensureAppUserRecord({
      id: signUpResult.user.id,
      name: signUpResult.user.name,
      email: signUpResult.user.email,
    });

    return signUpResult.user;
  } catch (signUpError) {
    try {
      const signInResult = await betterAuthServer.api.signInEmail({
        headers,
        body: {
          email,
          password,
        },
      });

      await ensureAppUserRecord({
        id: signInResult.user.id,
        name: signInResult.user.name,
        email: signInResult.user.email,
      });

      return signInResult.user;
    } catch {
      const existingUser = await createSessionForExistingAuthUser({
        authContext,
        email,
        ensureAppUserRecord,
      });

      if (existingUser) {
        return existingUser;
      }

      throw signUpError;
    }
  }
}
