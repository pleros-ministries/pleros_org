import { cookies, headers } from "next/headers";

import { normalizeEmailList, resolveRoleFromEmail, type AppRole } from "@/lib/app-role";
import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  decodeDemoSession,
  DEMO_AUTH_COOKIE_NAME,
  isDemoAuthEnabled,
  type DemoAuthSession,
} from "@/lib/demo-auth-session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
  };
  source: "demo" | "better-auth";
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

function toAppSession(session: DemoAuthSession, id: string, source: AppSession["source"]): AppSession {
  return {
    user: {
      id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
    source,
  };
}

function resolveRoleForEmail(email: string): AppRole {
  const adminEmails = normalizeEmailList(process.env.PPC_ADMIN_EMAILS);
  const instructorEmails = normalizeEmailList(process.env.PPC_INSTRUCTOR_EMAILS);

  return resolveRoleFromEmail(email, adminEmails, instructorEmails);
}

export async function getAppSession(): Promise<AppSession | null> {
  if (isDemoAuthEnabled()) {
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get(DEMO_AUTH_COOKIE_NAME)?.value;
    const demoSession = decodeDemoSession(rawCookie);

    if (!demoSession) {
      return null;
    }

    const dbUserId = await resolveDbUserId(demoSession.user.email);
    return toAppSession(demoSession, dbUserId ?? demoSession.user.email, "demo");
  }

  try {
    const headerStore = await headers();
    const authSession = await betterAuthServer.api.getSession({
      headers: headerStore,
    });

    if (!authSession?.user?.email || !authSession.user.name) {
      return null;
    }

    const dbUserId = await resolveDbUserId(authSession.user.email);
    return {
      user: {
        id: dbUserId ?? authSession.user.id ?? authSession.user.email,
        name: authSession.user.name,
        email: authSession.user.email,
        role: resolveRoleForEmail(authSession.user.email),
      },
      source: "better-auth",
    };
  } catch {
    return null;
  }
}
