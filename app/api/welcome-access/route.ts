import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { validateEmail } from "@/lib/welcome-flow";
import {
  createWelcomeAccessToken,
  getWelcomeAccessSecret,
  resolveWelcomeAccessName,
  WELCOME_ACCESS_COOKIE_NAME,
  WELCOME_ACCESS_MAX_AGE,
} from "@/lib/welcome-access";
import { provisionWelcomeSession } from "@/lib/welcome-session";
import { sendWelcomePackAccessEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const name = resolveWelcomeAccessName(email);

  try {
    await provisionWelcomeSession({
      email,
      name,
      requestHeaders: request.headers,
    });
  } catch (error) {
    console.error("Welcome Access Session Provision Error:", error);
    return NextResponse.json(
      {
        error:
          "We couldn't open your dashboard right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }

  const token = createWelcomeAccessToken(
    {
      email,
      name,
    },
    getWelcomeAccessSecret(process.env),
  );

  const cookieStore = await cookies();
  cookieStore.set(WELCOME_ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WELCOME_ACCESS_MAX_AGE,
  });

  const dashboardUrl = new URL("/dashboard", request.url).toString();

  void sendWelcomePackAccessEmail({
    to: email,
    name,
    dashboardUrl,
  }).catch((err) => {
    console.error("Failed to send welcome pack email:", err);
  });

  return NextResponse.json({ redirectTo: "/dashboard" });
}
