"use server";

import { getRoleDefaultPath } from "@/lib/app-access";
import {
  getAppUserByEmail,
  isConfiguredSuperAdminEmail,
  resolvePersistedRoleForEmail,
} from "@/lib/app-user";

export async function previewPortalAccess(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return null;
  }

  const role = await resolvePersistedRoleForEmail(normalizedEmail);
  const appUser = isConfiguredSuperAdminEmail(normalizedEmail)
    ? await getAppUserByEmail(normalizedEmail)
    : null;

  return {
    role,
    defaultPath: getRoleDefaultPath(role),
    setupRequired:
      role === "super_admin" &&
      (!appUser || appUser.role !== "super_admin" || !appUser.emailVerified),
  };
}
