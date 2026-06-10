import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { validateEmail } from "@/lib/welcome-flow";
import {
  createWelcomeAccessToken,
  getWelcomeAccessSecret,
  getWelcomeAccessCookieOptions,
  resolveWelcomeAccessName,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { sendWelcomePackAccessEmail } from "@/lib/email/send";
import { upsertWelcomePackLead } from "@/lib/db/queries/welcome-pack-leads";
import {
  normalizeWelcomeReturnTo,
  provisionWelcomeSession,
} from "@/lib/welcome-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; returnTo?: string; source?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const source = body?.source?.trim() || "welcome";
  const returnTo = normalizeWelcomeReturnTo(body?.returnTo, "/dashboard");

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
  cookieStore.set(
    WELCOME_ACCESS_COOKIE_NAME,
    token,
    getWelcomeAccessCookieOptions(),
  );

  await upsertWelcomePackLead({
    email,
    name,
    source,
  });

  const dashboardUrl = new URL("/dashboard/welcomepack", request.url).toString();

  void sendWelcomePackAccessEmail({
    to: email,
    name,
    dashboardUrl,
  }).catch((err) => {
    console.error("Failed to send welcome pack email:", err);
  });

  return NextResponse.json({ redirectTo: returnTo });
}
