"use server";

import { revalidatePath } from "next/cache";

import { getCommunityContext } from "@/lib/community/context";
import { CommunityError, type CommunityActionResult } from "@/lib/community/errors";
import type { NoPart } from "@/lib/community/meeting-report";
import { canAccessReporting } from "@/lib/community/reporting-access";
import { clearOwnNoReason, saveOwnMeeting, saveOwnNoReason } from "@/lib/db/queries/report-answers";

/** Self-report only: the subject is always the signed-in person (Pastor, 21 October; migration 0075). */
async function own<T extends object>(work: (userId: string) => Promise<T>): Promise<CommunityActionResult<T>> {
  try {
    const ctx = await getCommunityContext();
    if (!ctx || !(await canAccessReporting(ctx))) return { ok: false, error: "Sign in to record your report." };
    const value = await work(ctx.userId);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/community/report");
    revalidatePath("/dashboard/church");
    return { ok: true, ...value };
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false, error: error.message };
    throw error;
  }
}

export async function saveNoReasonAction(input: { dateKey: string; part: NoPart; reason: string }) {
  return own(userId => saveOwnNoReason(userId, input).then(() => ({})));
}

export async function clearNoReasonAction(input: { dateKey: string; part: NoPart }) {
  return own(userId => clearOwnNoReason(userId, input).then(() => ({})));
}

export async function saveMeetingAction(input: { dateKey: string; meeting: unknown }) {
  return own(userId => saveOwnMeeting(userId, input.dateKey, input.meeting));
}
