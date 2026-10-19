"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { logFollowUp, recordContactInvite, type FollowUpSubject } from "@/lib/db/queries/people-follow-ups";
import { handOverEnrollees, searchHandoverCandidates, type HandoverCandidate } from "@/lib/db/queries/enrollee-handover";
import { notify } from "@/lib/community/notify";
import { firstNameOf } from "@/lib/community/visibility";
import { inviteIntoOwnersGroups } from "@/lib/db/queries/follow-up-group-invites";

export type PeopleActionResult = { ok: true } | { ok: false; error: string };

async function run(fn: (userId: string) => Promise<void>): Promise<PeopleActionResult> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  try {
    await fn(session.user.id);
    // Saved contacts and My enrollees (and their people pages) read these.
    revalidatePath("/dashboard/community/contacts", "layout");
    revalidatePath("/dashboard/community/enrollees", "layout");
    revalidatePath("/dashboard/community/groups");
    return { ok: true };
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false, error: error.message };
    console.error("People action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function subjectOf(input: { enrollmentId?: unknown; privateContactId?: unknown }): FollowUpSubject {
  const id = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
  const enrollmentId = id(input.enrollmentId);
  const privateContactId = id(input.privateContactId);
  if (enrollmentId && !privateContactId) return { enrollmentId };
  if (privateContactId && !enrollmentId) return { privateContactId };
  throw new CommunityError("Choose who you followed up with.");
}

/** Logs a call, WhatsApp, visit, message or note with an enrollee or contact the viewer looks after. */
export async function logFollowUpAction(input: { enrollmentId?: number; privateContactId?: number; kind: string; note?: string }) {
  return run(userId => logFollowUp(userId, subjectOf(input), { kind: input.kind, note: input.note ?? "" }));
}

/** Remembers that the viewer shared one of their groups' invites with a contact. */
export async function recordContactInviteAction(input: { privateContactId: number; groupId: number }) {
  return run(userId => {
    if (!Number.isSafeInteger(input.privateContactId) || !Number.isSafeInteger(input.groupId)) throw new CommunityError("Choose a contact and a group.");
    return recordContactInvite(userId, input.privateContactId, input.groupId);
  });
}

/** People who could take over following up an enrollee (full names, adults only). */
export async function searchHandoverCandidatesAction(input: { enrollmentId: number; term: string }): Promise<{ ok: true; people: HandoverCandidate[] } | { ok: false; error: string }> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  try {
    return { ok: true, people: await searchHandoverCandidates(session.user.id, input.enrollmentId, input.term) };
  } catch (error) {
    console.error("Handover search failed:", error);
    return { ok: false, error: "Search failed. Try again." };
  }
}

/** Hands one or more enrollees the caller looks after to someone else. Both sides get a names-only notification. */
export async function handOverEnrolleesAction(input: { enrollmentIds: number[]; newOwnerUserId: string }): Promise<{ ok: true; moved: number; skipped: number } | { ok: false; error: string }> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  const fromName = firstNameOf(session.user.name);
  let result: Awaited<ReturnType<typeof handOverEnrollees>>;
  try {
    result = await handOverEnrollees(session.user.id, input.enrollmentIds, input.newOwnerUserId);
  } catch (error) {
    if (error instanceof CommunityError) return { ok: false, error: error.message };
    console.error("Handover failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  revalidatePath("/dashboard/community/enrollees", "layout");
  revalidatePath("/dashboard/sogp", "layout");
  const { moved } = result;
  // Groups as oversight: the new owner's group invites them; the old owner's pending invite is withdrawn.
  after(() => inviteIntoOwnersGroups(moved.map(row => row.enrollmentId), input.newOwnerUserId, session.user.id).then(() => undefined));
  after(async () => {
    const ownerName = moved[0]!.newOwnerFirstName;
    const first = moved[0]!;
    await notify({
      userIds: [input.newOwnerUserId],
      kind: "enrollee_handed_over",
      payload: { fromName, enrolleeName: moved.length === 1 ? first.enrolleeFirstName : `${moved.length} people`, enrollmentId: moved.length === 1 ? first.enrollmentId : null },
      pushBody: moved.length === 1 ? `${fromName} handed ${first.enrolleeFirstName} over to you.` : `${fromName} handed ${moved.length} people over to you.`,
      pushUrl: moved.length === 1 ? `/dashboard/community/enrollees/${first.enrollmentId}` : "/dashboard/community/enrollees",
      exclude: session.user.id,
    }).catch(error => console.error("Handover notice (new owner) failed:", error));
    await Promise.allSettled(moved.map(row => notify({
      userIds: [row.enrolleeUserId],
      kind: "follow_up_changed",
      payload: { ownerName },
      pushBody: `${ownerName} will look after you now.`,
      pushUrl: "/dashboard/sogp/follow-up/welcome",
    })));
  });
  return { ok: true, moved: moved.length, skipped: result.skipped };
}

/** One enrollee: the enrollee page's Hand over. */
export async function handOverEnrolleeAction(input: { enrollmentId: number; newOwnerUserId: string }): Promise<PeopleActionResult> {
  const result = await handOverEnrolleesAction({ enrollmentIds: [input.enrollmentId], newOwnerUserId: input.newOwnerUserId });
  return result.ok ? { ok: true } : result;
}
