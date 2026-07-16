import { cache } from "react";
import { headers } from "next/headers";

import type { AppRole } from "@/lib/app-role";
import {
  ensureAppUserRecord,
  getAppUserByEmail,
  isConfiguredSuperAdminEmail,
} from "@/lib/app-user";
import { betterAuthServer } from "@/lib/auth/better-auth";

export type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    role: AppRole;
  };
};

export const getAppSession = cache(async (): Promise<AppSession | null> => {
  try {
    const headerStore = await headers();
    const authSession = await betterAuthServer.api.getSession({
      headers: headerStore,
    });

    if (!authSession?.user?.email || !authSession.user.name) {
      return null;
    }

    const authUserId = authSession.user.id ?? authSession.user.email;

    if (isConfiguredSuperAdminEmail(authSession.user.email)) {
      return {
        user: {
          id: authUserId,
          name: authSession.user.name,
          email: authSession.user.email,
          role: "super_admin",
        },
      };
    }

    const appUser = await getAppUserByEmail(authSession.user.email);
    const role = appUser?.role ?? "student";
    const ppcUserId =
      appUser?.id ??
      (await ensureAppUserRecord({
        id: authUserId,
        name: authSession.user.name,
        email: authSession.user.email,
        role,
      }));

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
});
