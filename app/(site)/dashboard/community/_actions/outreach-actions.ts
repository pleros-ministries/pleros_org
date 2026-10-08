"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import type { CommunityContext } from "@/lib/community/context";
import {
  CommunityError,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  canDeleteInteraction,
  canSeeOutreachContact,
  normaliseContactUpdate,
  normaliseInteractionInput,
} from "@/lib/community/outreach-contacts";
import {
  addContactInteraction,
  deleteContactInteraction,
  deleteOwnContact,
  getContactDetail,
  getContactOwner,
  getInteractionOwner,
  updateContact,
  type ContactDetail,
} from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Returns expected failures as data; thrown messages are hidden in production. */
async function run<T extends object>(
  fn: () => Promise<T>,
): Promise<CommunityActionResult<T>> {
  try {
    const value = await fn();
    return { ...value, ok: true as const };
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

/** The viewer must be allowed to see this person: the member who met them, their pastor, or an admin. */
async function requireContactAccess(ctx: CommunityContext, contactId: number) {
  const owner = await getContactOwner(contactId);
  if (!owner) throw new CommunityError("That person is no longer on the list.");
  if (!canSeeOutreachContact(ctx, owner)) throw new Error("Forbidden");
  return owner;
}

/** A member removes one of their own people, with their history. */
export async function removeOutreachContactAction(
  contactId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    await deleteOwnContact(ctx.userId, contactId);
    revalidateContacts();
    return {};
  });
}

/** Read-only: one person with their whole interaction history. */
export async function getContactDetailAction(
  contactId: number,
): Promise<CommunityActionResult<{ detail: ContactDetail }>> {
  return run(async () => {
    const ctx = await requireCommunity();
    await requireContactAccess(ctx, contactId);
    const detail = await getContactDetail(contactId);
    if (!detail) throw new CommunityError("That person is no longer on the list.");
    return { detail };
  });
}

/** Changes a person's statuses, follow-up plan and next follow-up date. */
export async function updateContactAction(input: {
  contactId: number;
  salvationStatus: string;
  discipleshipStatus: string;
  followUpPlan: string;
  nextFollowUpDate: string;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    await requireContactAccess(ctx, input.contactId);
    const parsed = normaliseContactUpdate(input);
    if (!parsed.ok) throw new CommunityError(parsed.error);
    await updateContact(input.contactId, parsed.value);
    revalidateContacts();
    return {};
  });
}

/** Logs a call, visit or message with a person. The first one marks them followed up. */
export async function addContactInteractionAction(input: {
  contactId: number;
  kind: string;
  dateKey: string;
  saved?: boolean;
  filled?: boolean;
  healed?: boolean;
  note?: string;
}): Promise<CommunityActionResult<{ interactionId: number }>> {
  return run(async () => {
    const ctx = await requireCommunity();
    await requireContactAccess(ctx, input.contactId);
    const parsed = normaliseInteractionInput(input, lagosToday());
    if (!parsed.ok) throw new CommunityError(parsed.error);
    const row = await addContactInteraction(input.contactId, {
      ...parsed.value,
      userId: ctx.userId,
    });
    revalidateContacts();
    return { interactionId: row.id };
  });
}

/** Removes a logged follow-up: whoever logged it, or an admin. */
export async function deleteContactInteractionAction(
  interactionId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const interaction = await getInteractionOwner(interactionId);
    if (!interaction) throw new CommunityError("That entry is no longer there.");
    await requireContactAccess(ctx, interaction.contactId);
    if (!canDeleteInteraction(ctx, interaction)) throw new Error("Forbidden");
    await deleteContactInteraction(interactionId);
    revalidateContacts();
    return {};
  });
}
