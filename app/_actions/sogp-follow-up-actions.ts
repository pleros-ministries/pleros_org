"use server";
import { revalidatePath } from "next/cache";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { hasAdminAccess } from "@/lib/app-role";
import { CommunityError } from "@/lib/community/errors";
import { createOwnFollowUpRequest, resolveFollowUpRequest } from "@/lib/db/queries/sogp-follow-up-requests";

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
