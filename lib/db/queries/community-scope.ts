import { eq, inArray, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Narrows a user-id column to the members of one location group, or to
 * nobody in particular when no group is given. Shared by every staff read
 * that can be scoped to a group.
 */
export function inUnit(
  userIdColumn: AnyPgColumn,
  unitId: number | null | undefined,
): SQL | undefined {
  if (unitId == null) return undefined;
  return inArray(
    userIdColumn,
    db
      .select({ userId: schema.sogpEnrollments.userId })
      .from(schema.sogpEnrollments)
      .innerJoin(
        schema.unitMembers,
        eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
      )
      .where(eq(schema.unitMembers.unitId, unitId)),
  );
}
