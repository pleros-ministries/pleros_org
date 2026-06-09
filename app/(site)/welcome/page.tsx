import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomeLandingPage } from "@/components/home/welcome-landing-page";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function WelcomePage() {
  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeAccess) {
    redirect("/dashboard");
  }

  return <WelcomeLandingPage hasWelcomeAccess={Boolean(welcomeAccess)} />;
}
