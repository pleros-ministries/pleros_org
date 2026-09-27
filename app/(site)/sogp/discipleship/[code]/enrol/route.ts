import { NextResponse, type NextRequest } from "next/server";

import { getDiscipleshipInvite } from "@/lib/db/queries/sogp-discipleship";
import {
  DISCIPLESHIP_INVITE_COOKIE,
  DISCIPLESHIP_INVITE_COOKIE_MAX_AGE,
  isValidInviteCode,
} from "@/lib/sogp/discipleship";

/**
 * Remembers a discipleship invite while a new learner enrols, then hands off to
 * enrolment with the discipler's referral code. The cookie holds only the
 * invite code; joining still needs an explicit confirmation afterwards.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const enrolUrl = new URL("/sogp/enrol", request.url);
  if (!isValidInviteCode(code)) return NextResponse.redirect(enrolUrl);

  const invite = await getDiscipleshipInvite(code);
  if (!invite || invite.status !== "active") return NextResponse.redirect(enrolUrl);

  enrolUrl.searchParams.set("ref", invite.leaderReferralCode);
  const response = NextResponse.redirect(enrolUrl);
  response.cookies.set(DISCIPLESHIP_INVITE_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DISCIPLESHIP_INVITE_COOKIE_MAX_AGE,
  });
  return response;
}
