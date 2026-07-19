import { cookies } from "next/headers";

import { ThankYouPage } from "@/components/home/thank-you-page";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import { resolveWelcomeDisplayName } from "@/lib/welcome-display-name";

export default async function ThankYouRoute() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  const email = welcomeSession?.email ?? appSession?.user.email;
  const lead = email ? await getWelcomePackLeadByEmail(email) : null;
  const name = resolveWelcomeDisplayName({
    email,
    leadName: lead?.name,
    welcomeName: welcomeSession?.name,
    sessionName: appSession?.user.name,
  });

  return <ThankYouPage name={name ?? undefined} />;
}
