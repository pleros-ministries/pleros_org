import type { AppRole } from "./app-role";
import { hasAdminAccess, isStaffRole } from "./app-role";

export type AccessArea = "staff" | "admin" | "student";

export function canAccessArea(role: AppRole, area: AccessArea): boolean {
  if (area === "staff") {
    return isStaffRole(role);
  }

  if (area === "admin") {
    return hasAdminAccess(role);
  }

  return role === "student";
}

export function getRoleDefaultPath(role: AppRole): string {
  if (role === "student") {
    return "/ppc";
  }

  return "/admin";
}
