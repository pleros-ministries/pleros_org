import { cookies, headers } from "next/headers";

import { normalizeEmailList, resolveRoleFromEmail, type AppRole } from "@/lib/app-role";
import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  decodeDemoSession,
  DEMO_AUTH_COOKIE_NAME,
  isDemoAuthEnabled,
  type DemoAuthSession,
} from "@/lib/demo-auth-session";

export type AppSession = {
  user: {
    name: string;
    email: string;
    role: AppRole;
  };
  source: "demo" | "better-auth";
};

function toAppSession(session: DemoAuthSession, source: AppSession["source"]): AppSession {
  return {
    user: {
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

    return toAppSession(demoSession, "demo");
  }

  try {
    const headerStore = await headers();
    const authSession = await betterAuthServer.api.getSession({
      headers: headerStore,
    });

    if (!authSession?.user?.email || !authSession.user.name) {
      return null;
    }

    return {
      user: {
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
