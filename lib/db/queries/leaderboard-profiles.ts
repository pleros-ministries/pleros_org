import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { normaliseLeaderboardAlias } from "@/lib/leaderboard/monthly";

/** Takes you off the monthly leaderboard, or puts you back on it. */
export async function setLeaderboardHidden(userId: string, hidden: boolean) {
  await db
    .insert(s.leaderboardProfiles)
    .values({ userId, hidden })
    .onConflictDoUpdate({ target: s.leaderboardProfiles.userId, set: { hidden, updatedAt: sql`now()` } });
}

/**
 * Saves the name shown on the board instead of your first name; null goes
 * back to your first name. Names are unique whatever their case.
 */
export async function setLeaderboardAlias(userId: string, raw: string | null): Promise<{ alias: string | null } | { error: "invalid" | "taken" }> {
  const alias = normaliseLeaderboardAlias(raw);
  if (alias === undefined) return { error: "invalid" };
  try {
    await db
      .insert(s.leaderboardProfiles)
      .values({ userId, alias })
      .onConflictDoUpdate({ target: s.leaderboardProfiles.userId, set: { alias, updatedAt: sql`now()` } });
  } catch (error) {
    // Drizzle wraps the driver's error; the code is on it or on its cause.
    const failure = error as { code?: string; cause?: { code?: string } };
    if ((failure.code ?? failure.cause?.code) === "23505") return { error: "taken" };
    throw error;
  }
  return { alias };
}
