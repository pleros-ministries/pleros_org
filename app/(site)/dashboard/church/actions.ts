"use server";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { assignChurchBranchMembership, assignChurchMember, changeChurchUnitLeader, createChurchPlace, listWorkerMoveTargets, removeChurchWorker, renameChurchPlace, searchChurchCandidates } from "@/lib/db/queries/church-organisation";
import type { ChurchRole } from "@/lib/church/permissions";
import type { OldLeaderPlacement } from "@/lib/db/queries/church-organisation";

async function actor() { const session = await getAppSession(); if (!session) throw new CommunityError("Sign in to manage church assignments."); return session; }
export async function findChurchMembers(query: string) {
  const session = await actor();
  return searchChurchCandidates(session.user.id, query, session.user.role === "super_admin");
}
export async function saveChurchAssignment(input: { userId: string; role: ChurchRole; branchId: number | null; unitId: number | null; supervisorId: string | null; branchIds?: number[]; replace?: boolean }) {
  try {
    const session = await actor();
    await assignChurchMember(session.user.id, { userId: input.userId, role: input.role, branchId: input.branchId, unitId: input.unitId, supervisorId: input.supervisorId, branchIds: input.branchIds, replace: input.replace === true }, session.user.role === "super_admin");
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

/** Adds several members as workers in one unit under its leader; each goes through the guarded appointment service. */
export async function addUnitWorkers(input: { unitId: number; userIds: string[] }) {
  try {
    const session = await actor();
    const { getChurchPlace } = await import("@/lib/db/queries/church-home");
    const place = await getChurchPlace(session.user.id, { unitId: input.unitId });
    if (!place?.unit?.leader) return { ok: false as const, error: "Appoint a unit leader before adding workers." };
    const ids = [...new Set(input.userIds)].slice(0, 50);
    for (const userId of ids) await assignChurchMember(session.user.id, { userId, role: "worker", branchId: place.branch.id, unitId: place.unit.id, supervisorId: place.unit.leader.userId });
    revalidatePath("/dashboard", "layout");
    return { ok: true as const, count: ids.length };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}

/** Pastor tools on a unit's workers (user request, 19 October). */
export async function removeUnitWorker(input: { userId: string }) {
  try {
    const session = await actor();
    await removeChurchWorker(session.user.id, input.userId);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}

export async function moveUnitWorker(input: { userId: string; unitId: number }) {
  try {
    const session = await actor();
    const target = (await listWorkerMoveTargets(session.user.id)).find(unit => unit.id === input.unitId);
    if (!target) return { ok: false as const, error: "Choose one of your units." };
    if (!target.leaderId) return { ok: false as const, error: `Appoint a leader for ${target.name} first.` };
    await assignChurchMember(session.user.id, { userId: input.userId, role: "worker", branchId: target.branchId, unitId: target.id, supervisorId: target.leaderId });
    revalidatePath("/dashboard", "layout");
    return { ok: true as const, unitName: target.name };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}

export async function renameChurchPlaceAction(input: { kind: "branch" | "unit"; id: number; name: string }) {
  try {
    const session = await actor();
    const result = await renameChurchPlace(session.user.id, input);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const, name: result.name };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}

export async function changeUnitLeader(input: { unitId: number; userId: string; supervisorId: string | null; oldLeader: OldLeaderPlacement }) {
  try {
    const session = await actor();
    await changeChurchUnitLeader(session.user.id, input);
    revalidatePath("/dashboard", "layout");
    return { ok: true as const };
  } catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}
