/**
 * Partner gifts (user, 10 November): what givers report, or Paystack confirms.
 * Only admins see them. Pure helpers shared by the Report giving sheet, the
 * server action, the admin page and the Paystack verify route. Amounts are in
 * minor units (kobo or cents).
 */

export const giftCurrencies = ["NGN", "USD"] as const;
export type GiftCurrency = (typeof giftCurrencies)[number];

export const giftChannels = ["bank", "online", "cash", "other"] as const;
export type GiftChannel = (typeof giftChannels)[number];

export const giftChannelLabels: Record<GiftChannel, string> = {
  bank: "Bank transfer",
  online: "Online",
  cash: "Cash",
  other: "Other",
};

const currencySymbols: Record<GiftCurrency, string> = { NGN: "₦", USD: "$" };

export const GIFT_NOTE_MAX = 280;
/** Above this a typo is far likelier than a gift (₦/$ 1 billion). */
const MAX_MINOR = 100_000_000_000;

export type PartnerGift = {
  id: number;
  amountMinor: number;
  currency: GiftCurrency;
  channel: GiftChannel;
  givenOn: string;
  note: string | null;
};

export type GiftInput = { amount: string; currency: string; channel: string; givenOn: string; note?: string | null };

export function isGiftCurrency(value: unknown): value is GiftCurrency {
  return typeof value === "string" && (giftCurrencies as readonly string[]).includes(value);
}

export function isGiftChannel(value: unknown): value is GiftChannel {
  return typeof value === "string" && (giftChannels as readonly string[]).includes(value);
}

/** "5,000.50" → 500050. Null when it isn't a positive amount with at most two decimals. */
export function parseGiftAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s,₦$]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return minor > 0 && minor <= MAX_MINOR ? minor : null;
}

/** 500050, "NGN" → "₦5,000.50"; whole amounts drop the decimals ("₦5,000"). */
export function formatGiftAmount(minor: number, currency: GiftCurrency): string {
  const units = minor / 100;
  const whole = minor % 100 === 0;
  return currencySymbols[currency] + units.toLocaleString("en-GB", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/** Today as YYYY-MM-DD in the device's own time zone. */
export function localIsoDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export type ValidGift = Omit<PartnerGift, "id">;

/**
 * Checks a hand-added gift. `today` is the server's date; a day of leeway
 * either side of it covers givers in other time zones.
 */
export function validateGiftInput(input: GiftInput, today = localIsoDate()): { ok: true; gift: ValidGift } | { ok: false; error: string } {
  const amountMinor = parseGiftAmount(input.amount);
  if (amountMinor === null) return { ok: false, error: "Enter the amount you gave, for example 5000." };
  if (!isGiftCurrency(input.currency)) return { ok: false, error: "Choose Naira or US Dollars." };
  if (!isGiftChannel(input.channel)) return { ok: false, error: "Choose how you gave." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.givenOn) || Number.isNaN(Date.parse(`${input.givenOn}T00:00:00Z`))) {
    return { ok: false, error: "Choose the day you gave." };
  }
  const latest = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  if (input.givenOn > latest) return { ok: false, error: "The day you gave can't be in the future." };
  if (input.givenOn < "2000-01-01") return { ok: false, error: "Choose the day you gave." };
  const note = input.note?.trim() || null;
  if (note && note.length > GIFT_NOTE_MAX) return { ok: false, error: `Keep the note under ${GIFT_NOTE_MAX} characters.` };
  return { ok: true, gift: { amountMinor, currency: input.currency, channel: input.channel, givenOn: input.givenOn, note } };
}

/** Totals per currency for the year of `today`, in currency order. Never adds Naira to Dollars. */
export function yearTotals(gifts: readonly Pick<PartnerGift, "amountMinor" | "currency" | "givenOn">[], today = localIsoDate()) {
  const year = today.slice(0, 4);
  const totals = new Map<GiftCurrency, number>();
  for (const gift of gifts) {
    if (gift.givenOn.slice(0, 4) !== year) continue;
    totals.set(gift.currency, (totals.get(gift.currency) ?? 0) + gift.amountMinor);
  }
  return giftCurrencies.filter(c => totals.has(c)).map(currency => ({ currency, amountMinor: totals.get(currency)! }));
}
