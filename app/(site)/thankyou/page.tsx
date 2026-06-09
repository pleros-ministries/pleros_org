import { cookies } from "next/headers";

import { ThankYouPage } from "@/components/home/thank-you-page";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function ThankYouRoute() {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const lead = welcomeSession
    ? await getWelcomePackLeadByEmail(welcomeSession.email)
    : null;

  return (
    <ThankYouPage extraGiftsUnlocked={lead?.extraGiftsUnlocked ?? false} />
  );
}
