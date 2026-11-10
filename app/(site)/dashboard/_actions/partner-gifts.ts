"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { addPartnerGift, PartnerGiftsUnavailableError } from "@/lib/db/queries/partner-gifts";
import { validateGiftInput, type GiftInput } from "@/lib/partner-gifts";

export type ReportGivingResult = { ok: true } | { ok: false; error: string };

/** Report giving: tells Pleros about a gift the signed-in person made. Only admins see it. */
export async function reportGivingAction(input: GiftInput): Promise<ReportGivingResult> {
  const session = await getAppSession();
  if (!session) return { ok: false, error: "Log in to continue." };
  const checked = validateGiftInput(input);
  if (!checked.ok) return checked;
  try {
    await addPartnerGift(session.user.id, checked.gift);
  } catch (error) {
    if (error instanceof PartnerGiftsUnavailableError) return { ok: false, error: error.message };
    console.error("Report giving failed:", error);
    return { ok: false, error: "Couldn't send that. Check your connection and try again." };
  }
  revalidatePath("/admin/giving");
  return { ok: true };
}
