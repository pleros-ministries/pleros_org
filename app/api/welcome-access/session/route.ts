import { NextResponse } from "next/server";

import { WELCOME_ACCESS_COOKIE_NAME } from "@/lib/welcome-access";
import { normalizeWelcomeReturnTo } from "@/lib/welcome-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = normalizeWelcomeReturnTo(url.searchParams.get("returnTo"));
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", returnTo);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(WELCOME_ACCESS_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
