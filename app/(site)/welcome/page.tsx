import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomeLandingPage } from "@/components/home/welcome-landing-page";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function WelcomePage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (appSession || welcomeAccess) {
    redirect("/dashboard");
  }

  return <WelcomeLandingPage hasWelcomeAccess={Boolean(welcomeAccess)} />;
}
