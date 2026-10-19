"use server";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { assignChurchBranchMembership, assignChurchMember, createChurchPlace, renameChurchPlace, searchChurchCandidates } from "@/lib/db/queries/church-organisation";
import type { ChurchRole } from "@/lib/church/permissions";

/** The appointment is saved already; a failed notification must not report the save as failed. */
async function notifyNewUnitLeader(userId: string, unitId: number) {
  try { const { notifyChurchUnitLeader } = await import("@/lib/community/notify"); await notifyChurchUnitLeader({ userId, unitId }); }
  catch (error) { console.error("church leader notification failed", error); }
}

async function actor() { const session = await getAppSession(); if (!session) throw new CommunityError("Sign in to manage church assignments."); return session; }
export async function findChurchMembers(query: string) {
  const session = await actor();
  return searchChurchCandidates(session.user.id, query, session.user.role === "super_admin");
}
export async function saveChurchAssignment(input: { userId: string; role: ChurchRole; branchId: number | null; unitId: number | null; supervisorId: string | null; branchIds?: number[]; replace?: boolean }) {
  try {
    const session = await actor();
    const { becameLeaderOf } = await assignChurchMember(session.user.id, { userId: input.userId, role: input.role, branchId: input.branchId, unitId: input.unitId, supervisorId: input.supervisorId, branchIds: input.branchIds, replace: input.replace === true }, session.user.role === "super_admin");
    if (becameLeaderOf) await notifyNewUnitLeader(input.userId, becameLeaderOf);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}
export async function saveChurchBranchMembership(input: { userId: string; branchId: number }) {
  try {
    const session = await actor();
    await assignChurchBranchMembership(session.user.id, input);
    revalidatePath("/dashboard/church");
    revalidatePath("/admin/my-enrollees");
    return { ok: true as const };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}
export async function addChurchPlace(input: { name: string; branchId?: number }) {
  try { const session = await actor(); const id = await createChurchPlace(session.user.id, { name: input.name, branchId: input.branchId }); revalidatePath("/dashboard/church"); return { ok: true as const, id }; }
  catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}

export async function remindChurchMember(subjectId: string, day: string) {
  try { const session = await actor(); const { sendDailyReportReminder } = await import("@/lib/notifications/daily-report-dispatch"); const result = await sendDailyReportReminder({ subjectId, reportDate: day, viewerId: session.user.id, source: "manual" }); return { ok: true as const, ...result }; }
  catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}




export async function renameChurchPlaceAction(input: { kind: "branch" | "unit"; id: number; name: string }) {
  try {
    const session = await actor();
    const result = await renameChurchPlace(session.user.id, input);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const, name: result.name };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}

