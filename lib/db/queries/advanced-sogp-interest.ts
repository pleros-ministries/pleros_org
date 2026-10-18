import "server-only";

import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";

/** Postgres "relation does not exist": migration 0065 isn't applied yet. */
function missingTable(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

export class AdvancedSogpInterestUnavailableError extends Error {
  constructor() {
    super("Notifications for Advanced SOGP aren't switched on yet. Try again later.");
    this.name = "AdvancedSogpInterestUnavailableError";
  }
}

/** True when the learner has asked to hear when Advanced SOGP opens. False before migration 0065. */
export async function hasAdvancedSogpInterest(userId: string): Promise<boolean> {
  try {
    const [row] = await db.select({ id: s.advancedSogpInterest.id }).from(s.advancedSogpInterest)
      .where(eq(s.advancedSogpInterest.userId, userId)).limit(1);
    return Boolean(row);
  } catch (error) {
    if (missingTable(error)) return false;
    throw error;
  }
}

/** Registers interest once; a repeat is a no-op. Throws the unavailable error before migration 0065. */
export async function registerAdvancedSogpInterest(userId: string): Promise<void> {
  try {
    await db.insert(s.advancedSogpInterest).values({ userId }).onConflictDoNothing({ target: s.advancedSogpInterest.userId });
  } catch (error) {
    if (missingTable(error)) throw new AdvancedSogpInterestUnavailableError();
    throw error;
  }
}

/** How many learners are waiting for Advanced SOGP (admin use). 0 before migration 0065. */
export async function countAdvancedSogpInterest(): Promise<number> {
  try {
    const [row] = await db.select({ n: count() }).from(s.advancedSogpInterest);
    return row?.n ?? 0;
  } catch (error) {
    if (missingTable(error)) return 0;
    throw error;
  }
}
