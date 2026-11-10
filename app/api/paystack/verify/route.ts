import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { recordPaystackGift } from "@/lib/db/queries/partner-gifts";
import { isGiftCurrency, localIsoDate } from "@/lib/partner-gifts";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { reference?: string }
    | null;
  const reference = body?.reference?.trim() ?? "";

  if (!reference) {
    return NextResponse.json(
      { error: "Missing transaction reference." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const json = (await response.json().catch(() => null)) as {
      status?: boolean;
      data?: { status?: string; amount?: number; currency?: string; paid_at?: string | null };
    } | null;

    if (!json?.status || json.data?.status !== "success") {
      return NextResponse.json(
        { verified: false, error: "Payment was not successful." },
        { status: 402 },
      );
    }

    await recordOnlineGift(reference, json.data);

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error("Paystack Verify Error:", error);
    return NextResponse.json(
      {
        error: "We couldn't verify your payment. Please contact support.",
      },
      { status: 500 },
    );
  }
}

/**
 * A signed-in giver's confirmed online gift is recorded for the admin Giving
 * page (user, 10 November). Never fails the verify.
 */
async function recordOnlineGift(reference: string, data: { amount?: number; currency?: string; paid_at?: string | null }) {
  try {
    const session = await getAppSession();
    if (!session || !isGiftCurrency(data.currency)) return;
    if (!Number.isInteger(data.amount) || !data.amount || data.amount <= 0) return;
    const paidOn = data.paid_at && !Number.isNaN(Date.parse(data.paid_at)) ? data.paid_at.slice(0, 10) : localIsoDate();
    await recordPaystackGift(session.user.id, { reference, amountMinor: data.amount, currency: data.currency, givenOn: paidOn });
  } catch (error) {
    console.error("Recording online gift failed:", error);
  }
}
