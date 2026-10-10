"use server";

import { revalidatePath } from "next/cache";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { CommunityError, type CommunityActionResult } from "@/lib/community/errors";
import { declareOwnDailyReport } from "@/lib/db/queries/daily-report-declarations";
import type { DailyReportCategory, DailyReportDeclaration } from "@/lib/community/daily-report";

/** Self-report only. Clients cannot choose a subject, actor or organisational scope. */
export async function declareDailyReport(input: { dateKey: string; category: DailyReportCategory; declaration: DailyReportDeclaration }): Promise<CommunityActionResult> {
  try {
    const ctx = await getCommunityContext();
    if (!ctx || !canAccessCommunity(ctx)) return { ok: false, error: "Sign in to record your report." };
    await declareOwnDailyReport(ctx.userId, { dateKey: input.dateKey, category: input.category, declaration: input.declaration });
    revalidatePath("/dashboard/community/report");
    revalidatePath("/dashboard/community/leader");
    return { ok: true };
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false, error: error.message };
    throw error;
  }
}
