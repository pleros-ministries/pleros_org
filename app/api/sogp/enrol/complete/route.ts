import { NextRequest, NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { betterAuthServer } from "@/lib/auth/better-auth";
import {
  getPendingSogpEnrollmentByTokenHash,
  getSogpCohortById,
  markPendingSogpCompleted,
  upsertSogpEnrollment,
} from "@/lib/db/queries/sogp";
import { sendSogpEnrollmentEmail } from "@/lib/email/send";
import {
  SOGP_SETUP_COOKIE,
  getSogpFlowSecret,
  getSogpSetupCookieOptions,
  hashSogpFlowToken,
  validateLearnerPassword,
} from "@/lib/sogp/auth-flow";
import {
  replaceSogpCredentialPassword,
  validateSogpSetupCompletion,
} from "@/lib/sogp/enrollment-auth";
import {
  buildSogpEnrollmentRedirect,
  formatSogpReferralSource,
} from "@/lib/sogp/enrollment";

const cohortDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

function formatCohortDates(startsAt: Date, endsAt: Date) {
  return `${cohortDateFormatter.format(startsAt)} – ${cohortDateFormatter.format(endsAt)}`;
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SOGP_SETUP_COOKIE)?.value;
  const body = (await request.json().catch(() => null)) as
    | { password?: unknown; confirmation?: unknown }
    | null;
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmation =
    typeof body?.confirmation === "string" ? body.confirmation : "";
  const errors = validateLearnerPassword(password, confirmation);

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ error: "Your setup session has expired." }, { status: 401 });
  }

  const [session, pending] = await Promise.all([
    getAppSession(),
    getPendingSogpEnrollmentByTokenHash(
      hashSogpFlowToken(token, getSogpFlowSecret(process.env)),
    ),
  ]);
  if (!session || !pending) {
    return NextResponse.json({ error: "Verify your email before continuing." }, { status: 401 });
  }

  const setupStatus = validateSogpSetupCompletion(
    pending,
    session.user.email,
  );
  if (!setupStatus.ok) {
    return NextResponse.json(
      { error: "Your verified setup session is no longer valid." },
      { status: 401 },
    );
  }

  const cohort = await getSogpCohortById(pending.cohortId);
  if (!cohort || !pending.authUserId) {
    return NextResponse.json(
      { error: "We could not complete your enrolment. Try again shortly." },
      { status: 409 },
    );
  }

  try {
    await replaceSogpCredentialPassword(pending.authUserId, password);
    await betterAuthServer.api.revokeOtherSessions({ headers: request.headers });

    const values = pending.payload;
    await upsertSogpEnrollment({
      cohortId: cohort.id,
      userId: session.user.id,
      firstName: values.firstName,
      lastName: values.lastName,
      name: values.name,
      email: pending.email,
      phone: values.phone,
      countryCode: values.countryCode,
      country: values.country,
      region: values.region,
      birthYear: values.birthYear ? Number(values.birthYear) : null,
      referralSource: formatSogpReferralSource({
        referralSource: values.referralSource,
        referralSourceOther: values.referralSourceOther,
      }),
      whatsappConsent: values.whatsappConsent === true,
      utmSource: values.utmSource,
      utmMedium: values.utmMedium,
      utmCampaign: values.utmCampaign,
      utmContent: values.utmContent,
      utmTerm: values.utmTerm,
    });

    const redirect = buildSogpEnrollmentRedirect({
      cohortChannelUrl: cohort.telegramChannelUrl,
      configuredChannelUrl: process.env.TELEGRAM_SOGP_CHANNEL_URL,
    });
    if (!redirect) {
      throw new Error("SOGP Telegram channel is not configured.");
    }

    await markPendingSogpCompleted(pending.id);
    void sendSogpEnrollmentEmail({
      to: pending.email,
      name: values.name,
      cohortTitle: cohort.title,
      cohortDates: formatCohortDates(cohort.startsAt, cohort.endsAt),
      dashboardUrl: "https://pleros.org/dashboard/welcomepack/join",
    }).catch((error) => console.error("SOGP enrolment email failed:", error));

    const response = NextResponse.json({
      redirectTo: "/dashboard/welcomepack/join",
    });
    response.cookies.set(SOGP_SETUP_COOKIE, "", {
      ...getSogpSetupCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("SOGP enrolment completion failed:", error);
    return NextResponse.json(
      { error: "We could not complete your enrolment. Try again shortly." },
      { status: 500 },
    );
  }
}
