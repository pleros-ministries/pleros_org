import { cookies } from "next/headers";

import { ThankYouPage } from "@/components/home/thank-you-page";
import { getAppSession } from "@/lib/app-session";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function ThankYouRoute() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const email = appSession?.user.email ?? welcomeSession?.email;
  const lead = email
    ? await getWelcomePackLeadByEmail(email)
    : null;

  return (
    <ThankYouPage extraGiftsUnlocked={lead?.extraGiftsUnlocked ?? false} />
  );
}
