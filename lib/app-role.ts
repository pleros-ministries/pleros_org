export type AppRole = "super_admin" | "admin" | "instructor" | "student";

export type StaffInviteRole = "admin" | "instructor";

export function isAppRole(value: string): value is AppRole {
  return (
    value === "super_admin" ||
    value === "admin" ||
    value === "instructor" ||
    value === "student"
  );
}

export function isStaffRole(role: AppRole): boolean {
  return role === "super_admin" || role === "admin" || role === "instructor";
}

export function hasAdminAccess(role: AppRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function normalizeEmailList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 0);
}

export function resolveRoleFromEmail(
  email: string,
  adminEmails: string[],
  instructorEmails: string[],
): AppRole {
  const normalizedEmail = email.trim().toLowerCase();

  if (adminEmails.includes(normalizedEmail)) {
    return "admin";
  }

  if (instructorEmails.includes(normalizedEmail)) {
    return "instructor";
  }

  return "student";
}
