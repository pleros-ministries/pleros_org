import { headers } from "next/headers";

import type { AppRole } from "@/lib/app-role";
import { ensureAppUserRecord, resolveRoleForEmail } from "@/lib/app-user";
import { betterAuthServer } from "@/lib/auth/better-auth";

export type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
  };
};

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
    const ppcUserId = await ensureAppUserRecord({
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
