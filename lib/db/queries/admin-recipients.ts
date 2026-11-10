import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Everyone who should hear about new contact messages and Ask Pleros
 * questions: verified admins and super admins.
 */
export async function listAdminNotificationEmails(): Promise<string[]> {
  const rows = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(
      and(
        inArray(schema.users.role, ["admin", "super_admin"]),
        eq(schema.users.emailVerified, true),
      ),
    );
  return rows.map((row) => row.email);
}
