"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { CommunityError } from "@/lib/community/errors";
import { logFollowUp, recordContactInvite, type FollowUpSubject } from "@/lib/db/queries/people-follow-ups";

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
