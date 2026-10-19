"use server";
import { revalidatePath } from "next/cache";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { CommunityError } from "@/lib/community/errors";
import { acceptLinkOwner } from "@/lib/db/queries/sogp-follow-up-routes";
import { DiscipleshipError } from "@/lib/db/queries/sogp-discipleship";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { respondToInvitation, searchGroupInvitees, sendInAppInvitation, withdrawInvitation, type InviteCandidate } from "@/lib/db/queries/sogp-group-invitations";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";
import { isPastorAssignedToEnrollment } from "@/lib/db/queries/pastor-followups";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function refresh() {
  revalidatePath("/dashboard/sogp", "layout");
  revalidatePath("/dashboard/community");
}

/** Link arrival: keep the person whose link was used. */
export async function acceptFollowUpOwner(): Promise<Result> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: "Sign in to save your choice." };
  try { await acceptLinkOwner(session.user.id); refresh(); return { ok: true }; }
  catch (error) { return { ok: false, error: error instanceof CommunityError ? error.message : "Your choice could not be saved. Try again." }; }
}

/** Recipient accepts or declines; actor comes from the session only. */
export async function answerGroupInvitation(input: { invitationId: number; accept: boolean; sharesPhone: boolean; move?: boolean }): Promise<Result<{ status: "accepted" | "declined" }>> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: "Sign in to respond." };
  if (!Number.isInteger(input.invitationId)) return { ok: false, error: "This invitation isn't available." };
  try {
    const result = await respondToInvitation({ userId: session.user.id, invitationId: input.invitationId, accept: input.accept === true, sharesPhone: input.sharesPhone === true, move: input.move === true });
    if (result.ok) refresh();
    return result;
  } catch { return { ok: false, error: "Your response could not be saved. Try again." }; }
}

/**
 * Leader invites someone they follow up with. Recipients are limited to the
 * caller's own assigned enrollees: no open account search or contact matching.
 */
export async function inviteEnrolleeToGroup(input: { groupId: number; enrollmentId: number }): Promise<Result<{ invitationId: number }>> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: "Sign in to send an invitation." };
  try {
    const leader = await getSogpEnrollmentByUserId(session.user.id);
    if (!leader) return { ok: false, error: "An SOGP enrolment is required." };
    if (!(await isPastorAssignedToEnrollment(session.user.id, input.enrollmentId))) return { ok: false, error: "You can invite people you follow up with." };
    const { id } = await sendInAppInvitation({ leaderUserId: session.user.id, leaderEnrollmentId: leader.id, groupId: input.groupId, recipientEnrollmentId: input.enrollmentId });
    refresh();
    return { ok: true, invitationId: id };
  } catch (error) {
    return { ok: false, error: error instanceof DiscipleshipError || error instanceof CommunityError ? error.message : "The invitation could not be sent. Try again." };
  }
}

export async function withdrawGroupInvitation(invitationId: number): Promise<Result> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: "Sign in to continue." };
  const leader = await getSogpEnrollmentByUserId(session.user.id);
  if (!leader || !(await withdrawInvitation(leader.id, invitationId))) return { ok: false, error: "This invitation can no longer be withdrawn." };
  refresh();
  return { ok: true };
}

/** Leaders find people to add to a group by name (groups as oversight, 19 October). */
export async function findGroupInvitees(input: { groupId: number; term: string }): Promise<Result<{ people: InviteCandidate[] }>> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: "Sign in to continue." };
  if (!groupOversightEnabled()) return { ok: false, error: "Adding people by name isn't available yet." };
  if (!Number.isInteger(input.groupId) || typeof input.term !== "string") return { ok: false, error: "Search by name." };
  try {
    const leader = await getSogpEnrollmentByUserId(session.user.id);
    if (!leader) return { ok: false, error: "An SOGP enrolment is required." };
    return { ok: true, people: await searchGroupInvitees({ leaderUserId: session.user.id, leaderEnrollmentId: leader.id, groupId: input.groupId, term: input.term }) };
  } catch (error) {
    return { ok: false, error: error instanceof DiscipleshipError || error instanceof CommunityError ? error.message : "Search is unavailable. Try again." };
  }
}

/** Invites anyone found by name; they join only when they accept. */
export async function inviteToGroupByName(input: { groupId: number; enrollmentId: number }): Promise<Result<{ invitationId: number }>> {
  const session = await getDashboardActionSession();
  if (!session) return { ok: false, error: "Sign in to send an invitation." };
  if (!groupOversightEnabled()) return { ok: false, error: "Adding people by name isn't available yet." };
  if (!Number.isInteger(input.groupId) || !Number.isInteger(input.enrollmentId)) return { ok: false, error: "Choose someone to invite." };
  try {
    const leader = await getSogpEnrollmentByUserId(session.user.id);
    if (!leader) return { ok: false, error: "An SOGP enrolment is required." };
    const { id } = await sendInAppInvitation({ leaderUserId: session.user.id, leaderEnrollmentId: leader.id, groupId: input.groupId, recipientEnrollmentId: input.enrollmentId });
    refresh();
    return { ok: true, invitationId: id };
  } catch (error) {
    return { ok: false, error: error instanceof DiscipleshipError || error instanceof CommunityError ? error.message : "The invitation could not be sent. Try again." };
  }
}
