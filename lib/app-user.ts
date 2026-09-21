import type { AppRole } from "./app-role";
import { normalizeEmailList } from "./app-role";
import { db } from "./db";
import { eq, ilike, or } from "drizzle-orm";

const BUILT_IN_SUPER_ADMIN_EMAILS = [
  "akintyr@gmail.com",
  "adeyemodaniel10@gmail.com",
] as const;

// Built-in defaults, plus any comma-separated addresses in SUPER_ADMIN_EMAILS.
export const SUPER_ADMIN_EMAILS: readonly string[] = [
  ...new Set([
    ...BUILT_IN_SUPER_ADMIN_EMAILS,
    ...normalizeEmailList(process.env.SUPER_ADMIN_EMAILS),
  ]),
];

export const DEFAULT_SUPER_ADMIN_EMAIL = SUPER_ADMIN_EMAILS[0];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isConfiguredSuperAdminEmail(email: string) {
  return SUPER_ADMIN_EMAILS.includes(normalizeEmail(email));
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

export async function getAppUserById(id: string) {
  try {
    return (
      (await db.query.users.findFirst({
        where: (u, { eq: equal }) => equal(u.id, id),
      })) ?? null
    );
  } catch {
    return null;
  }
}

/** Search any registered account by name or email — for picking an existing
 * user to grant staff/pastor access to, without needing their exact email. */
export async function searchAppUsers(query: string, limit = 8) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const { users } = await import("./db/schema");
    const like = `%${trimmed}%`;

    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(or(ilike(users.name, like), ilike(users.email, like)))
      .orderBy(users.name)
      .limit(limit);
  } catch {
    return [];
  }
}

export async function hasSuperAdminUser() {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { and, eq }) =>
        and(eq(u.role, "super_admin"), eq(u.emailVerified, true)),
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
        .filter((user) => user.role === "super_admin" && user.emailVerified)
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
  emailVerified?: boolean;
}): Promise<string> {
  const normalizedEmail = normalizeEmail(opts.email);
  const existing = await getAppUserByEmail(normalizedEmail);
  const role = opts.role ?? (await resolvePersistedRoleForEmail(normalizedEmail));

  if (existing) {
    const updates: Partial<{
      role: AppRole;
      emailVerified: boolean;
    }> = {};

    if (existing.role !== role) {
      updates.role = role;
    }

    if (
      typeof opts.emailVerified === "boolean" &&
      existing.emailVerified !== opts.emailVerified
    ) {
      updates.emailVerified = opts.emailVerified;
    }

    if (Object.keys(updates).length > 0) {
      const { users } = await import("./db/schema");

      await db
        .update(users)
        .set(updates)
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
      emailVerified: opts.emailVerified ?? false,
    }).onConflictDoNothing();

    return opts.id;
  } catch {
    return opts.id;
  }
}
