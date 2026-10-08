import { and, eq, like, lt, or } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

/**
 * `notification_checkpoints` as an idempotency store for scheduled pushes.
 *
 * Always claim before sending: the insert either wins the key or does not, so
 * two overlapping cron runs can never both send. (`sogp-discipleship.ts` keeps
 * its own private copy of `claimCheckpoint` for its alerts and digests.)
 */

/** Claims `key`; false when another run already holds it. */
export async function claimCheckpoint(key: string, value = "sent") {
  const [claimed] = await db
    .insert(schema.notificationCheckpoints)
    .values({ key, value })
    .onConflictDoNothing()
    .returning({ key: schema.notificationCheckpoints.key });
  return Boolean(claimed);
}

/** Gives a claim back so a later run can retry after a failure. */
export async function releaseCheckpoint(key: string) {
  await db
    .delete(schema.notificationCheckpoints)
    .where(eq(schema.notificationCheckpoints.key, key));
}

export async function getCheckpointValue(key: string) {
  const [row] = await db
    .select({ value: schema.notificationCheckpoints.value })
    .from(schema.notificationCheckpoints)
    .where(eq(schema.notificationCheckpoints.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function setCheckpointValue(key: string, value: string) {
  await db
    .insert(schema.notificationCheckpoints)
    .values({ key, value })
    .onConflictDoUpdate({
      target: schema.notificationCheckpoints.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * Deletes old keys that start with one of `prefixes`. Only pass prefixes whose
 * keys embed a date (see `PRUNABLE_CHECKPOINT_PREFIXES`): those can never be
 * re-evaluated, so removing them cannot cause a second send.
 */
export async function pruneCheckpoints(
  olderThan: Date,
  prefixes: readonly string[],
) {
  if (prefixes.length === 0) return 0;

  const deleted = await db
    .delete(schema.notificationCheckpoints)
    .where(
      and(
        lt(schema.notificationCheckpoints.updatedAt, olderThan),
        or(
          ...prefixes.map((prefix) =>
            like(schema.notificationCheckpoints.key, `${prefix}%`),
          ),
        ),
      ),
    )
    .returning({ key: schema.notificationCheckpoints.key });

  return deleted.length;
}
