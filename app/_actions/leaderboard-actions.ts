"use server";

import { revalidatePath } from "next/cache";

import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { setLeaderboardAlias, setLeaderboardHidden } from "@/lib/db/queries/leaderboard-profiles";
import { LEADERBOARD_ALIAS_HELP } from "@/lib/leaderboard/monthly";

// Expected failures are returned, not thrown: thrown messages are hidden in production.
export type LeaderboardActionResult = { ok: true } | { ok: false; error: string };

const SIGNED_OUT = "You need to be signed in to change how you appear on the leaderboard.";
const SAVE_ERROR = "Couldn’t save that. Check your connection and try again.";

/** Takes you off this month's board, or puts you back on it. */
export async function setLeaderboardHiddenAction(hidden: boolean): Promise<LeaderboardActionResult> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: SIGNED_OUT };
  try {
    await setLeaderboardHidden(session.user.id, hidden === true);
  } catch {
    return { ok: false, error: SAVE_ERROR };
  }
  revalidatePath("/dashboard/leaderboard");
  return { ok: true };
}

/** Saves the name shown on the board instead of your first name; null clears it. */
export async function setLeaderboardAliasAction(alias: string | null): Promise<LeaderboardActionResult> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: SIGNED_OUT };
  let result: Awaited<ReturnType<typeof setLeaderboardAlias>>;
  try {
    result = await setLeaderboardAlias(session.user.id, alias);
  } catch {
    return { ok: false, error: SAVE_ERROR };
  }
  if ("error" in result) return { ok: false, error: result.error === "taken" ? "That name is taken. Try another." : LEADERBOARD_ALIAS_HELP };
  revalidatePath("/dashboard/leaderboard");
  return { ok: true };
}
