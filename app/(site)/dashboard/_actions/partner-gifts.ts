"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { addPartnerGift, PartnerGiftsUnavailableError, removePartnerGift } from "@/lib/db/queries/partner-gifts";
import { validateGiftInput, type GiftInput, type PartnerGift } from "@/lib/partner-gifts";

export type AddPartnerGiftResult = { ok: true; gift: PartnerGift } | { ok: false; error: string };
export type RemovePartnerGiftResult = { ok: true } | { ok: false; error: string };

const genericError = "Couldn't save that. Check your connection and try again.";

/** "I've given": records a gift the signed-in person made by transfer, cash or otherwise. */
export async function addPartnerGiftAction(input: GiftInput): Promise<AddPartnerGiftResult> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  const checked = validateGiftInput(input);
  if (!checked.ok) return checked;
  try {
    const gift = await addPartnerGift(session.user.id, checked.gift);
    revalidatePath("/dashboard/partner");
    return { ok: true, gift };
  } catch (error) {
    if (error instanceof PartnerGiftsUnavailableError) return { ok: false, error: error.message };
    console.error("Partner gift failed:", error);
    return { ok: false, error: genericError };
  }
}

/** Removes one of the person's own recorded gifts. */
export async function removePartnerGiftAction(id: number): Promise<RemovePartnerGiftResult> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "That gift is already gone." };
  try {
    const removed = await removePartnerGift(session.user.id, id);
    if (!removed) return { ok: false, error: "That gift is already gone." };
    revalidatePath("/dashboard/partner");
    return { ok: true };
  } catch (error) {
    if (error instanceof PartnerGiftsUnavailableError) return { ok: false, error: error.message };
    console.error("Partner gift removal failed:", error);
    return { ok: false, error: "Couldn't remove that. Check your connection and try again." };
  }
}
