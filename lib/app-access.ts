import type { AppRole } from "./app-role";

export type AccessArea = "staff" | "admin" | "student";

export function canAccessArea(role: AppRole, area: AccessArea): boolean {
  if (area === "staff") {
    return role === "admin" || role === "instructor";
  }

  if (area === "admin") {
    return role === "admin";
  }

  return role === "student";
}

export function getRoleDefaultPath(role: AppRole): string {
  if (role === "student") {
    return "/ppc";
  }

  return "/admin";
}
