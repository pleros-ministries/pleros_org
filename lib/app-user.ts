import type { AppRole } from "./app-role";
import { normalizeEmailList, resolveRoleFromEmail } from "./app-role";
import { db } from "./db";

export function resolveRoleForEmail(email: string): AppRole {
  const adminEmails = normalizeEmailList(process.env.PPC_ADMIN_EMAILS);
  const instructorEmails = normalizeEmailList(process.env.PPC_INSTRUCTOR_EMAILS);

  return resolveRoleFromEmail(email, adminEmails, instructorEmails);
}

export async function resolveDbUserId(email: string): Promise<string | null> {
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email.toLowerCase()),
    });

    return user?.id ?? null;
  } catch {
    return null;
  }
}

export async function ensureAppUserRecord(opts: {
  id: string;
  name: string;
  email: string;
  role?: AppRole;
}): Promise<string> {
  const existing = await resolveDbUserId(opts.email);

  if (existing) {
    return existing;
  }

  try {
    const { users } = await import("./db/schema");

    await db.insert(users).values({
      id: opts.id,
      name: opts.name,
      email: opts.email.toLowerCase(),
      role: opts.role ?? resolveRoleForEmail(opts.email),
    }).onConflictDoNothing();

    return opts.id;
  } catch {
    return opts.id;
  }
}
