import { headers } from "next/headers";

import { normalizeEmailList, resolveRoleFromEmail, type AppRole } from "@/lib/app-role";
import { betterAuthServer } from "@/lib/auth/better-auth";
import { db } from "@/lib/db";

export type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
  };
};

async function resolveDbUserId(email: string): Promise<string | null> {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq: eq2 }) => eq2(u.email, email.toLowerCase()),
    });
    return user?.id ?? null;
  } catch {
    return null;
  }
}

async function ensurePpcUser(opts: {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}): Promise<string> {
  const existing = await resolveDbUserId(opts.email);
  if (existing) return existing;

  try {
    const { users } = await import("@/lib/db/schema");
    await db.insert(users).values({
      id: opts.id,
      name: opts.name,
      email: opts.email.toLowerCase(),
      role: opts.role,
    }).onConflictDoNothing();
    return opts.id;
  } catch {
    return opts.id;
  }
}

function resolveRoleForEmail(email: string): AppRole {
  const adminEmails = normalizeEmailList(process.env.PPC_ADMIN_EMAILS);
  const instructorEmails = normalizeEmailList(process.env.PPC_INSTRUCTOR_EMAILS);

  return resolveRoleFromEmail(email, adminEmails, instructorEmails);
}

export async function getAppSession(): Promise<AppSession | null> {
  try {
    const headerStore = await headers();
    const authSession = await betterAuthServer.api.getSession({
      headers: headerStore,
    });

    if (!authSession?.user?.email || !authSession.user.name) {
      return null;
    }

    const role = resolveRoleForEmail(authSession.user.email);
    const ppcUserId = await ensurePpcUser({
      id: authSession.user.id ?? authSession.user.email,
      name: authSession.user.name,
      email: authSession.user.email,
      role,
    });

    return {
      user: {
        id: ppcUserId,
        name: authSession.user.name,
        email: authSession.user.email,
        role,
      },
    };
  } catch {
    return null;
  }
}
