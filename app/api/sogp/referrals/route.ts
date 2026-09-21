import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getSogpReferralsDashboard } from "@/lib/db/queries/sogp-referrals";

export async function GET() {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const data = await getSogpReferralsDashboard(session.user.id);
  if (!data) {
    return NextResponse.json(
      { error: "SOGP enrolment not found", enrolUrl: "/sogp/enrol" },
      { status: 403 },
    );
  }

  return NextResponse.json(data);
}
