import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DiscipleshipJourneyPage } from "@/components/dashboard/discipleship-journey-page";
import { getAppSession } from "@/lib/app-session";
import { discipleshipJourneySections } from "@/lib/discipleship-journey-content";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export default async function DashboardDiscipleshipJourneyPage() {
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!appSession && welcomeSession) {
    redirect("/api/welcome-access/session?returnTo=%2Fdashboard%2Fdiscipleship-journey");
  }

  if (!appSession) {
    redirect("/welcome");
  }

  return <DiscipleshipJourneyPage sections={discipleshipJourneySections} />;
}
