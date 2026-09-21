import { NextRequest, NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  getOpenSogpCohort,
  getSogpEnrollmentsWithCohortByUserId,
  upsertSogpEnrollment,
} from "@/lib/db/queries/sogp";
import { runSogpPostEnrollmentSideEffects } from "@/lib/sogp/enrollment-side-effects";
import { canOfferJoinAnotherCohort } from "@/lib/sogp/status";

export async function POST(request: NextRequest) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
  }

  const openCohort = await getOpenSogpCohort();
  if (!openCohort) {
    return NextResponse.json(
      { error: "Enrolment is not open right now." },
      { status: 409 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { cohortId?: unknown }
    | null;
  if (typeof body?.cohortId === "number" && body.cohortId !== openCohort.id) {
    return NextResponse.json(
      { error: "That cohort is no longer open for enrolment." },
      { status: 409 },
    );
  }

  const rows = await getSogpEnrollmentsWithCohortByUserId(session.user.id);
  if (!canOfferJoinAnotherCohort(rows, openCohort.id)) {
    return NextResponse.json(
      { error: "You are not eligible to join another cohort right now." },
      { status: 409 },
    );
  }

  const source = rows[0]!.enrollment;

  try {
    const enrollment = await upsertSogpEnrollment({
      cohortId: openCohort.id,
      userId: session.user.id,
      firstName: source.firstName,
      lastName: source.lastName,
      name: source.name,
      email: source.email,
      phone: source.phone,
      countryCode: source.countryCode,
      country: source.country,
      region: source.region,
      birthYear: source.birthYear,
      referralSource: source.referralSource,
      whatsappConsent: source.whatsappConsent,
    });

    runSogpPostEnrollmentSideEffects({
      enrollment,
      cohort: openCohort,
      userId: session.user.id,
      values: {
        firstName: source.firstName,
        lastName: source.lastName,
        name: source.name,
        email: source.email,
        phone: source.phone,
        country: source.country,
        region: source.region,
        birthYear: source.birthYear,
        referralSource: source.referralSource,
        referralSourceOther: "",
        referredByCode: "",
      },
    });

    return NextResponse.json({ redirectTo: "/dashboard/sogp" });
  } catch (error) {
    console.error("SOGP join-cohort failed:", error);
    return NextResponse.json(
      { error: "We could not complete your enrolment. Try again shortly." },
      { status: 500 },
    );
  }
}
