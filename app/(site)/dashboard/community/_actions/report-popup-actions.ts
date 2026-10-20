"use server";

import { revalidatePath } from "next/cache";

import { getCommunityContext } from "@/lib/community/context";
import { CommunityError } from "@/lib/community/errors";
import { canAccessReporting } from "@/lib/community/reporting-access";
import { logPlanReading, saveBiblePlan, saveTeachingReport } from "@/lib/db/queries/report-popups";

/** Bible plan and Teaching writes from the report pop-ups; subject is always the signed-in member. */
async function run<T>(fn: (userId: string) => Promise<T>) {
  try {
    const ctx = await getCommunityContext();
    if (!ctx || !await canAccessReporting(ctx)) throw new CommunityError("You do not have access to reporting.");
    const value = await fn(ctx.userId);
    for (const path of ["/dashboard", "/dashboard/community/report", "/dashboard/prayer-watch"]) revalidatePath(path);
    return { ok: true as const, value };
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false as const, error: error.message };
    throw error;
  }
}

export async function saveBiblePlanAction(input: { dateKey: string; chaptersPerDay: number; book: string; chapter: number }) {
  return run(userId => saveBiblePlan(userId, input));
}
/** `chapters` left out means the plan's own number for the day. */
export async function logPlanReadingAction(input: { dateKey: string; chapters?: number }) {
  return run(userId => logPlanReading(userId, input));
}
export async function saveTeachingReportAction(input: { dateKey: string; source: string; otherTitle?: string | null; note: string }) {
  return run(userId => saveTeachingReport(userId, input));
}
