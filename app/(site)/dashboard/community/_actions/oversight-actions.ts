"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { markOversightUpdateDone } from "@/lib/db/queries/oversight-updates";

/** Ticks an Oversight update off, or back on. Only the viewer's own list changes. */
export async function setOversightUpdateDone(key: string, done: boolean) {
  try {
    const session = await getAppSession();
    if (!session) throw new CommunityError("Sign in to update Oversight.");
    await markOversightUpdateDone(session.user.id, key, done);
    revalidatePath("/dashboard/community/oversight", "layout");
    return { ok: true as const };
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false as const, error: error.message };
    throw error;
  }
}
