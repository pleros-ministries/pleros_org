import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomeAudiobookPage } from "@/components/dashboard/welcome-audiobook-page";
import { getAppSession } from "@/lib/app-session";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardWelcomeAudiobookPage() {
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (welcomeSession) {
    return <WelcomeAudiobookPage />;
  }

  const appSession = await getAppSession();

  if (!appSession) {
    redirect("/welcome");
  }

  return <WelcomeAudiobookPage />;
}
