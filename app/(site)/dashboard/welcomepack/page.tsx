import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { WelcomePackPage } from "@/components/dashboard/welcome-pack-page";
import { getAppSession } from "@/lib/app-session";
import { getWelcomePackLeadByEmail } from "@/lib/db/queries/welcome-pack-leads";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardWelcomePackPage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!welcomeSession) {
    redirect("/");
  }

  if (!appSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard%2Fwelcomepack");
  }

  const lead = await getWelcomePackLeadByEmail(welcomeSession.email);
  const extraGiftsUnlocked = lead?.extraGiftsUnlocked ?? false;

  return <WelcomePackPage extraGiftsUnlocked={extraGiftsUnlocked} />;
}
