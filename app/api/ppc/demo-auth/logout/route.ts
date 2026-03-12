import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { toExternalPpcPath } from "@/lib/ppc-access";
import { DEMO_AUTH_COOKIE_NAME } from "@/lib/demo-auth-session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL(toExternalPpcPath(request.headers.get("host"), "/sign-in"), request.url),
  );

  response.cookies.set(DEMO_AUTH_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return response;
}
