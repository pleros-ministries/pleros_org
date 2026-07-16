import { cookies } from "next/headers";

import { ThankYouPage } from "@/components/home/thank-you-page";
import { getAppSession } from "@/lib/app-session";
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

  const name = appSession?.user.name ?? welcomeSession?.name;

  return <ThankYouPage name={name} />;
}
