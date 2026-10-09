import { after, NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getActiveSogpJourneyWithContext } from "@/lib/db/queries/sogp-journey";
import {
  awardSogpWeekCertificates,
  sendSogpWeekCertificateNotices,
} from "@/lib/db/queries/sogp-week-certificates";

export async function GET() {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const loaded = await getActiveSogpJourneyWithContext(session.user.id);
  if (!loaded) {
    return NextResponse.json(
      { error: "SOGP enrolment not found", enrolUrl: "/sogp/enrol" },
      { status: 403 },
    );
  }
  // Award any week the learner has just completed, so the dashboard shows
  // the certificate straight away. The journey still loads if this fails.
  let data = loaded.journey;
  try {
    const result = await awardSogpWeekCertificates(loaded);
    data = result.journey;
    if (result.awarded.length) {
      after(() => sendSogpWeekCertificateNotices(loaded.context, result.awarded));
    }
  } catch (error) {
    console.error("SOGP week certificate award failed:", error);
  }
  return NextResponse.json(data);
}
