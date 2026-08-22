import { NextResponse } from "next/server";

import { resolveDbUserId } from "@/lib/app-user";
import {
  getOpenSogpCohort,
  storeSogpTelegramLinkTokenHash,
  upsertSogpEnrollment,
} from "@/lib/db/queries/sogp";
import { sendSogpEnrollmentEmail } from "@/lib/email/send";
import {
  normalizeSogpEnrollment,
  validateSogpEnrollment,
  type SogpEnrollmentInput,
} from "@/lib/sogp/enrollment";
import {
  createSogpTelegramLink,
  getSogpTelegramLinkSecret,
} from "@/lib/telegram/sogp";
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
    const enrollment = await upsertSogpEnrollment({
      ...values,
      cohortId: cohort.id,
      userId,
    });

    const botUsername =
      cohort.telegramBotUsername ?? process.env.TELEGRAM_SOGP_BOT_USERNAME;
    const telegramLink = botUsername
      ? createSogpTelegramLink({
          enrollmentId: enrollment.id,
          botUsername,
          secret: getSogpTelegramLinkSecret(process.env),
        })
      : null;

    if (telegramLink) {
      await storeSogpTelegramLinkTokenHash(
        enrollment.id,
        telegramLink.tokenHash,
      );
    }

    const dashboardUrl = new URL("/dashboard/sogp", request.url).toString();
    void sendSogpEnrollmentEmail({
      to: values.email,
      name: values.name,
      cohortTitle: cohort.title,
      cohortDates: formatCohortDates(cohort.startsAt, cohort.endsAt),
      dashboardUrl,
      telegramUrl: telegramLink?.url ?? cohort.telegramDiscussionUrl,
    }).catch((error) => {
      console.error("SOGP enrolment email failed:", error);
    });

    return NextResponse.json({
      redirectTo: "/dashboard/sogp",
      telegramUrl: telegramLink?.url ?? cohort.telegramDiscussionUrl,
    });
  } catch (error) {
    console.error("SOGP enrolment failed:", error);
    return NextResponse.json(
      { error: "We could not complete your enrolment. Try again shortly." },
      { status: 500 },
    );
  }
}
