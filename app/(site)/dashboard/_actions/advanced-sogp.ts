"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { AdvancedSogpInterestUnavailableError, registerAdvancedSogpInterest } from "@/lib/db/queries/advanced-sogp-interest";

export type AdvancedSogpInterestResult = { ok: true } | { ok: false; error: string };

/** "Notify me when Advanced SOGP opens": records the signed-in learner's interest once. */
export async function registerAdvancedSogpInterestAction(): Promise<AdvancedSogpInterestResult> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  try {
    await registerAdvancedSogpInterest(session.user.id);
  } catch (error) {
    if (error instanceof AdvancedSogpInterestUnavailableError) return { ok: false, error: error.message };
    console.error("Advanced SOGP interest failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/sogp");
  return { ok: true };
}
