"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import type { CommunityContext } from "@/lib/community/context";
import {
  CommunityError,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  canSeeOutreachContact,
  normaliseFollowUpNote,
} from "@/lib/community/outreach-contacts";
import {
  deleteOwnContact,
  getContactOwner,
  setContactFollowUp,
} from "@/lib/db/queries/outreach-contacts";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Returns expected failures as data; thrown messages are hidden in production. */
async function run(fn: () => Promise<void>): Promise<CommunityActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    if (error instanceof CommunityError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function revalidateContacts() {
  revalidatePath("/dashboard/community/report");
  revalidatePath("/dashboard/community/report/people");
  revalidatePath("/dashboard/community/leader");
  revalidatePath("/admin/ministry");
}

/** A member removes one of their own entries. */
export async function removeOutreachContactAction(
  contactId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    await deleteOwnContact(ctx.userId, contactId);
    revalidateContacts();
  });
}

/**
 * Marks a person followed up, or puts them back on the to-do list. Pass `note`
 * to set the follow-up note; without it the note is left as it is. Allowed for
 * the member who met them, the pastor assigned to that member's location
 * group, and admins.
 */
export async function setOutreachFollowUpAction(input: {
  contactId: number;
  done: boolean;
  note?: string;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const owner = await getContactOwner(input.contactId);
    if (!owner) throw new CommunityError("That person is no longer on the list.");
    if (!canSeeOutreachContact(ctx, owner)) throw new Error("Forbidden");

    await setContactFollowUp(
      input.contactId,
      input.done
        ? {
            by: ctx.userId,
            note:
              input.note === undefined ? undefined : normaliseFollowUpNote(input.note),
          }
        : null,
    );
    revalidateContacts();
  });
}
