"use server";

import { getRoleDefaultPath } from "@/lib/app-access";
import { resolveRoleForEmail } from "@/lib/app-user";

export async function previewPortalAccess(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return null;
  }

  const role = resolveRoleForEmail(normalizedEmail);

  return {
    role,
    defaultPath: getRoleDefaultPath(role),
  };
}
