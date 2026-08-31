import { NextRequest, NextResponse } from "next/server";

import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  getPendingSogpEnrollmentByTokenHash,
  markPendingSogpVerified,
} from "@/lib/db/queries/sogp";
import {
  SOGP_SETUP_COOKIE,
  getSogpFlowSecret,
  hashSogpFlowToken,
  isSogpSetupExpired,
} from "@/lib/sogp/auth-flow";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SOGP_SETUP_COOKIE)?.value;
  const body = (await request.json().catch(() => null)) as { otp?: unknown } | null;
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!token) {
    return NextResponse.json({ error: "Your setup session has expired." }, { status: 401 });
  }

  if (!/^\d{6}$/.test(otp)) {
    return NextResponse.json(
      { error: "Enter the six-digit code from your email." },
      { status: 400 },
    );
  }

  const pending = await getPendingSogpEnrollmentByTokenHash(
    hashSogpFlowToken(token, getSogpFlowSecret(process.env)),
  );
  if (!pending || isSogpSetupExpired(pending.expiresAt)) {
    return NextResponse.json({ error: "Your setup session has expired." }, { status: 401 });
  }

  try {
    if (pending.otpPurpose === "email_verification") {
      await betterAuthServer.api.verifyEmailOTP({
        headers: request.headers,
        body: { email: pending.email, otp },
      });
    } else {
      await betterAuthServer.api.signInEmailOTP({
        headers: request.headers,
        body: { email: pending.email, otp },
      });
    }

    await markPendingSogpVerified(pending.id);
    return NextResponse.json({ nextStep: "password" });
  } catch {
    return NextResponse.json(
      { error: "That code is invalid or expired. Request a new code." },
      { status: 400 },
    );
  }
}
