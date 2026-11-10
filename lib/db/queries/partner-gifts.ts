import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { isGiftChannel, isGiftCurrency, type PartnerGift, type ValidGift } from "@/lib/partner-gifts";

/** Postgres "relation does not exist": migration 0078 isn't applied yet. */
function missingTable(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

export class PartnerGiftsUnavailableError extends Error {
  constructor() {
    super("Recording gifts isn't switched on yet. Try again later.");
    this.name = "PartnerGiftsUnavailableError";
  }
}

/** Records a reported gift. Only admins read these back. */
export async function addPartnerGift(userId: string, gift: ValidGift): Promise<void> {
  try {
    await db.insert(s.partnerGifts).values({ userId, ...gift });
  } catch (error) {
    if (missingTable(error)) throw new PartnerGiftsUnavailableError();
    throw error;
  }
}

export type AdminPartnerGift = PartnerGift & { name: string; email: string; online: boolean; reportedAt: Date };

/** Every reported and online gift with the giver, newest first (admin only). Empty before migration 0078. */
export async function listAllPartnerGifts(): Promise<AdminPartnerGift[]> {
  try {
    const rows = await db.select({
      id: s.partnerGifts.id,
      amountMinor: s.partnerGifts.amountMinor,
      currency: s.partnerGifts.currency,
      channel: s.partnerGifts.channel,
      givenOn: s.partnerGifts.givenOn,
      note: s.partnerGifts.note,
      paystackReference: s.partnerGifts.paystackReference,
      reportedAt: s.partnerGifts.createdAt,
      name: s.users.name,
      email: s.users.email,
    }).from(s.partnerGifts)
      .innerJoin(s.users, eq(s.users.id, s.partnerGifts.userId))
      .orderBy(desc(s.partnerGifts.givenOn), desc(s.partnerGifts.id));
    return rows.flatMap(({ paystackReference, ...row }) => {
      if (!isGiftCurrency(row.currency) || !isGiftChannel(row.channel)) return [];
      return [{ ...row, currency: row.currency, channel: row.channel, online: paystackReference !== null }];
    });
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }
}

/**
 * An online gift Paystack confirmed for a signed-in giver. Recorded once per
 * reference; a repeat verify is a no-op. Quietly skipped before migration 0078.
 */
export async function recordPaystackGift(userId: string, gift: Omit<ValidGift, "channel" | "note"> & { reference: string }): Promise<void> {
  try {
    await db.insert(s.partnerGifts).values({
      userId,
      amountMinor: gift.amountMinor,
      currency: gift.currency,
      channel: "online",
      givenOn: gift.givenOn,
      paystackReference: gift.reference,
    }).onConflictDoNothing({ target: s.partnerGifts.paystackReference });
  } catch (error) {
    if (missingTable(error)) return;
    throw error;
  }
}
