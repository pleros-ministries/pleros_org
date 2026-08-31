import { NextRequest, NextResponse } from "next/server";

import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  createPendingSogpEnrollment,
  deleteExpiredPendingSogpEnrollments,
  getLatestPendingSogpEnrollmentByEmail,
  getOpenSogpCohort,
  recordPendingSogpCodeSent,
} from "@/lib/db/queries/sogp";
import {
  SOGP_SETUP_COOKIE,
  SOGP_SETUP_TTL_SECONDS,
  canSendSogpCode,
  createSogpFlowToken,
  getSogpFlowSecret,
  getSogpSetupCookieOptions,
  hashSogpFlowToken,
} from "@/lib/sogp/auth-flow";
import {
  ensureSogpAuthUser,
  getSogpOtpPurpose,
} from "@/lib/sogp/enrollment-auth";
import {
  normalizeSogpEnrollment,
  validateSogpEnrollment,
  type SogpEnrollmentInput,
} from "@/lib/sogp/enrollment";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SogpEnrollmentInput | null;
  const values = normalizeSogpEnrollment(body ?? {});
  const errors = validateSogpEnrollment(values);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const cohort = await getOpenSogpCohort();
  if (!cohort) {
    return NextResponse.json(
      { error: "Enrolment is not open right now." },
      { status: 409 },
    );
  }

  try {
    const email = values.email.trim().toLowerCase();
    await deleteExpiredPendingSogpEnrollments();
    const latestPending = await getLatestPendingSogpEnrollmentByEmail(email);
    if (
      latestPending &&
      !canSendSogpCode({
        sentAt: latestPending.codeSentAt,
        sendCount: latestPending.codeSendCount,
      })
    ) {
      return NextResponse.json(
        { error: "Wait before requesting another verification code." },
        { status: 429 },
      );
    }
    const authUser = await ensureSogpAuthUser({ email, name: values.name });
    const otpPurpose = getSogpOtpPurpose(authUser);
    const token = createSogpFlowToken();
    const tokenHash = hashSogpFlowToken(
      token,
      getSogpFlowSecret(process.env),
    );

    const pending = await createPendingSogpEnrollment({
      flowTokenHash: tokenHash,
      cohortId: cohort.id,
      email,
      payload: values,
      authUserId: authUser.id,
      otpPurpose,
      expiresAt: new Date(Date.now() + SOGP_SETUP_TTL_SECONDS * 1000),
    });

    await betterAuthServer.api.sendVerificationOTP({
      headers: request.headers,
      body: {
        email,
        type:
          otpPurpose === "email_verification"
            ? "email-verification"
            : "sign-in",
      },
    });
    await recordPendingSogpCodeSent(pending.id);

    const response = NextResponse.json({ redirectTo: "/setup" });
    response.cookies.set(
      SOGP_SETUP_COOKIE,
      token,
      getSogpSetupCookieOptions(),
    );
    return response;
  } catch (error) {
    console.error("SOGP enrolment setup failed:", error);
    return NextResponse.json(
      { error: "We could not send your verification code. Try again shortly." },
      { status: 503 },
    );
  }
}
