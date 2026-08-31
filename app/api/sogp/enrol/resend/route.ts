import { NextRequest, NextResponse } from "next/server";

import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  getPendingSogpEnrollmentByTokenHash,
  recordPendingSogpCodeSent,
} from "@/lib/db/queries/sogp";
import {
  SOGP_SETUP_COOKIE,
  canSendSogpCode,
  getSogpFlowSecret,
  hashSogpFlowToken,
  isSogpSetupExpired,
} from "@/lib/sogp/auth-flow";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SOGP_SETUP_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Your setup session has expired." }, { status: 401 });
  }

  const pending = await getPendingSogpEnrollmentByTokenHash(
    hashSogpFlowToken(token, getSogpFlowSecret(process.env)),
  );
  if (!pending || isSogpSetupExpired(pending.expiresAt)) {
    return NextResponse.json({ error: "Your setup session has expired." }, { status: 401 });
  }

  if (!canSendSogpCode({ sentAt: pending.codeSentAt, sendCount: pending.codeSendCount })) {
    return NextResponse.json(
      { error: "Wait before requesting another code." },
      { status: 429 },
    );
  }

  try {
    await betterAuthServer.api.sendVerificationOTP({
      headers: request.headers,
      body: {
        email: pending.email,
        type:
          pending.otpPurpose === "email_verification"
            ? "email-verification"
            : "sign-in",
      },
    });
    await recordPendingSogpCodeSent(pending.id);
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json(
      { error: "We could not send another code. Try again shortly." },
      { status: 503 },
    );
  }
}
