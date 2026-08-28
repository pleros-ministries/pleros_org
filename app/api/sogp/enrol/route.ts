import { NextResponse } from "next/server";

import { resolveDbUserId } from "@/lib/app-user";
import {
  getOpenSogpCohort,
  upsertSogpEnrollment,
} from "@/lib/db/queries/sogp";
import { sendSogpEnrollmentEmail } from "@/lib/email/send";
import {
  buildSogpEnrollmentRedirect,
  normalizeSogpEnrollment,
  validateSogpEnrollment,
  type SogpEnrollmentInput,
} from "@/lib/sogp/enrollment";
import { provisionWelcomeSession } from "@/lib/welcome-session";

function formatCohortDates(startsAt: Date, endsAt: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
  return `${formatter.format(startsAt)} – ${formatter.format(endsAt)}`;
}

export async function POST(request: Request) {
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
    const authUser = await provisionWelcomeSession({
      email: values.email,
      name: values.name,
      requestHeaders: request.headers,
    });
    const userId = (await resolveDbUserId(authUser.email)) ?? authUser.id;
    await upsertSogpEnrollment({
      ...values,
      birthYear: values.birthYear ? Number(values.birthYear) : null,
      whatsappConsent: values.whatsappConsent === true,
      cohortId: cohort.id,
      userId,
    });

    const redirect = buildSogpEnrollmentRedirect({
      cohortChannelUrl: cohort.telegramChannelUrl,
      configuredChannelUrl: process.env.TELEGRAM_SOGP_CHANNEL_URL,
    });
    if (!redirect) {
      return NextResponse.json(
        {
          error:
            "Your enrolment was saved, but the Telegram channel is not configured yet.",
        },
        { status: 500 },
      );
    }

    void sendSogpEnrollmentEmail({
      to: values.email,
      name: values.name,
      cohortTitle: cohort.title,
      cohortDates: formatCohortDates(cohort.startsAt, cohort.endsAt),
      telegramUrl: redirect.telegramUrl,
    }).catch((error) => {
      console.error("SOGP enrolment email failed:", error);
    });

    return NextResponse.json(redirect);
  } catch (error) {
    console.error("SOGP enrolment failed:", error);
    return NextResponse.json(
      { error: "We could not complete your enrolment. Try again shortly." },
      { status: 500 },
    );
  }
}
