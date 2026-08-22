import { NextResponse } from "next/server";

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
      data?: { status?: string };
    } | null;

    if (!json?.status || json.data?.status !== "success") {
      return NextResponse.json(
        { verified: false, error: "Payment was not successful." },
        { status: 402 },
      );
    }

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
