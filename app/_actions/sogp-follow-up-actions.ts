"use server";
import { revalidatePath } from "next/cache";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { hasAdminAccess } from "@/lib/app-role";
import { CommunityError } from "@/lib/community/errors";
import { createOwnFollowUpRequest, listFollowUpOwnerCandidates, resolveFollowUpRequest } from "@/lib/db/queries/sogp-follow-up-requests";

function refreshFollowUp() {
  revalidatePath("/dashboard/sogp", "layout");
  revalidatePath("/admin/follow-up-requests");
  revalidatePath("/admin/my-enrollees");
  revalidatePath("/admin/pastors");
}
export async function sendFollowUpRequest(reason: unknown) {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false as const, error: "Sign in to send your request." };
  try { await createOwnFollowUpRequest(session.user.id, reason); refreshFollowUp(); return { ok: true as const }; }
  catch (error) { return { ok: false as const, error: error instanceof CommunityError ? error.message : "Your request could not be sent. Try again; your current assignment is unchanged." }; }
}
export async function reviewFollowUpRequest(input: { requestId: number; decision: "approve" | "decline"; replacementUserId?: string }) {
  const session = await getDashboardActionSession();
  if (!session || !hasAdminAccess(session.user.role)) return { ok: false as const, error: "Only an admin can review these requests." };
  try { await resolveFollowUpRequest(input); refreshFollowUp(); return { ok: true as const }; }
  catch (error) { return { ok: false as const, error: error instanceof CommunityError ? error.message : "This decision could not be saved. Refresh and try again." }; }
}

/** Admin-only bounded search for any active enrollee as a follow-up owner. */
export async function searchFollowUpOwners(search: string) {
  const session = await getDashboardActionSession();
  if (!session || !hasAdminAccess(session.user.role)) return { ok: false as const, error: "Only an admin can choose follow-up owners." };
  try { return { ok: true as const, value: await listFollowUpOwnerCandidates(typeof search === "string" ? search : "") }; }
  catch { return { ok: false as const, error: "People could not be loaded. Try again." }; }
}

/** Coordinator direct owner change; same eligibility and stale-owner guard as request approval. */
export async function changeEnrolleeOwner(input: { enrollmentId: number; ownerUserId: string; expectedOwnerId: string | null }) {
  const session = await getDashboardActionSession();
  if (!session || !hasAdminAccess(session.user.role)) return { ok: false as const, error: "Only an admin can change follow-up owners." };
  try {
    const { changeFollowUpOwner } = await import("@/lib/db/queries/sogp-coordinator");
    await changeFollowUpOwner(input); refreshFollowUp(); revalidatePath("/admin/follow-up"); return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof CommunityError ? error.message : "The owner could not be changed. Try again." }; }
}
