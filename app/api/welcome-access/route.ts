import { NextResponse } from "next/server";

import { validateEmail } from "@/lib/welcome-flow";
import { resolveWelcomeAccessName } from "@/lib/welcome-access";
import { sendWelcomePackAccessEmail } from "@/lib/email/send";
import { upsertWelcomePackLead } from "@/lib/db/queries/welcome-pack-leads";
import {
  normalizeWelcomeReturnTo,
} from "@/lib/welcome-session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { email?: string; name?: string; returnTo?: string; source?: string }
    | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const source = body?.source?.trim() || "welcome";
  const returnTo = normalizeWelcomeReturnTo(body?.returnTo, "/thankyou");

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const name = body?.name?.trim() || resolveWelcomeAccessName(email);

  const leadResult = await upsertWelcomePackLead({
    email,
    name,
    source,
  });

  const dashboardUrl = new URL(
    "/login?returnTo=/dashboard/welcomepack",
    request.url,
  ).toString();

  if (leadResult.created) {
    void sendWelcomePackAccessEmail({
      to: email,
      name,
      dashboardUrl,
    }).catch((err) => {
      console.error("Failed to send welcome pack email:", err);
    });
  }

  return NextResponse.json({ redirectTo: returnTo });
}
