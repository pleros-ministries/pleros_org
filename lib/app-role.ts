export type AppRole = "admin" | "instructor" | "student";

export function isAppRole(value: string): value is AppRole {
  return value === "admin" || value === "instructor" || value === "student";
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
