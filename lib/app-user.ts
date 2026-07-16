import type { AppRole } from "./app-role";
import { db } from "./db";
import { eq } from "drizzle-orm";

export const SUPER_ADMIN_EMAILS = [
  "akintyr@gmail.com",
  "adeyemodaniel10@gmail.com",
] as const;

export const DEFAULT_SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAILS[0];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isConfiguredSuperAdminEmail(email: string) {
  return SUPER_ADMIN_EMAILS.includes(
    normalizeEmail(email) as (typeof SUPER_ADMIN_EMAILS)[number],
  );
}

export async function resolveDbUserId(email: string): Promise<string | null> {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, normalizeEmail(email)),
    });

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function getAppUserByEmail(email: string) {
  try {
    return (
      (await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, normalizeEmail(email)),
      })) ?? null
    );
  } catch {
    return null;
  }
}

export async function hasSuperAdminUser() {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.role, "super_admin"),
    });

    return Boolean(user);
  } catch {
    return false;
  }
}

export async function getMissingSuperAdminEmails() {
  try {
    const users = await db.query.users.findMany({
      where: (u, { inArray }) => inArray(u.email, [...SUPER_ADMIN_EMAILS]),
    });
    const existingSuperAdminEmails = new Set(
      users
        .filter((user) => user.role === "super_admin")
        .map((user) => normalizeEmail(user.email)),
    );

    return SUPER_ADMIN_EMAILS.filter(
      (email) => !existingSuperAdminEmails.has(email),
    );
  } catch {
    return [...SUPER_ADMIN_EMAILS];
  }
}

export async function resolvePersistedRoleForEmail(email: string): Promise<AppRole> {
  const normalizedEmail = normalizeEmail(email);

  if (isConfiguredSuperAdminEmail(normalizedEmail)) {
    return "super_admin";
  }

  const user = await getAppUserByEmail(normalizedEmail);

  if (user?.role) {
    return user.role;
  }

  return "student";
}

export async function ensureAppUserRecord(opts: {
  id: string;
  name: string;
  email: string;
  role?: AppRole;
}): Promise<string> {
  const normalizedEmail = normalizeEmail(opts.email);
  const existing = await getAppUserByEmail(normalizedEmail);
  const role = opts.role ?? (await resolvePersistedRoleForEmail(normalizedEmail));

  if (existing) {
    if (existing.role !== role) {
      const { users } = await import("./db/schema");

      await db
        .update(users)
        .set({ role })
        .where(eq(users.id, existing.id));
    }

    return existing.id;
  }

  try {
    const { users } = await import("./db/schema");

    await db.insert(users).values({
      id: opts.id,
      name: opts.name,
      email: normalizedEmail,
      role,
    }).onConflictDoNothing();

    return opts.id;
  } catch {
    return opts.id;
  }
}
