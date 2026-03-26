import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import {
  normalizeWelcomeReturnTo,
  provisionWelcomeSession,
} from "@/lib/welcome-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = normalizeWelcomeReturnTo(url.searchParams.get("returnTo"));
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!welcomeSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    await provisionWelcomeSession({
      email: welcomeSession.email,
      name: welcomeSession.name,
      requestHeaders: request.headers,
    });
  } catch {
    return NextResponse.redirect(
      new URL("/ppc/sign-up?returnTo=%2Fppc%2Fstudent", request.url),
    );
  }

  return NextResponse.redirect(new URL(returnTo, request.url));
}
