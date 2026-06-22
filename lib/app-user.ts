import type { AppRole } from "./app-role";
import { db } from "./db";
import { eq } from "drizzle-orm";

export const DEFAULT_SUPER_ADMIN_EMAIL = "fccibadan@gmail.com";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

export async function resolvePersistedRoleForEmail(email: string): Promise<AppRole> {
  const normalizedEmail = normalizeEmail(email);
  const user = await getAppUserByEmail(normalizedEmail);

  if (user?.role) {
    return user.role;
  }

  if (
    normalizedEmail === DEFAULT_SUPER_ADMIN_EMAIL &&
    !(await hasSuperAdminUser())
  ) {
    return "super_admin";
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
