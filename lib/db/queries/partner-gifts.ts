import "server-only";

import { and, desc, eq } from "drizzle-orm";

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

const columns = {
  id: s.partnerGifts.id,
  amountMinor: s.partnerGifts.amountMinor,
  currency: s.partnerGifts.currency,
  channel: s.partnerGifts.channel,
  givenOn: s.partnerGifts.givenOn,
  note: s.partnerGifts.note,
};

function toGift(row: { id: number; amountMinor: number; currency: string; channel: string; givenOn: string; note: string | null }): PartnerGift | null {
  if (!isGiftCurrency(row.currency) || !isGiftChannel(row.channel)) return null;
  return { ...row, currency: row.currency, channel: row.channel };
}

/** The giver's own gifts, newest first. Empty before migration 0078. */
export async function listPartnerGifts(userId: string): Promise<PartnerGift[]> {
  try {
    const rows = await db.select(columns).from(s.partnerGifts)
      .where(eq(s.partnerGifts.userId, userId))
      .orderBy(desc(s.partnerGifts.givenOn), desc(s.partnerGifts.id));
    return rows.map(toGift).filter((gift): gift is PartnerGift => gift !== null);
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }
}

/** Records a hand-added gift and returns the saved row. */
export async function addPartnerGift(userId: string, gift: ValidGift): Promise<PartnerGift> {
  try {
    const [row] = await db.insert(s.partnerGifts).values({ userId, ...gift }).returning(columns);
    return toGift(row)!;
  } catch (error) {
    if (missingTable(error)) throw new PartnerGiftsUnavailableError();
    throw error;
  }
}

/** Removes one of the giver's own gifts. True when a row went. */
export async function removePartnerGift(userId: string, id: number): Promise<boolean> {
  try {
    const rows = await db.delete(s.partnerGifts)
      .where(and(eq(s.partnerGifts.id, id), eq(s.partnerGifts.userId, userId)))
      .returning({ id: s.partnerGifts.id });
    return rows.length > 0;
  } catch (error) {
    if (missingTable(error)) throw new PartnerGiftsUnavailableError();
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
