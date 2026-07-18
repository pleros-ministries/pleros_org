import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { DiscipleshipJourneySeriesPage } from "@/components/dashboard/discipleship-journey-series-page";
import { getAppSession } from "@/lib/app-session";
import {
  getDiscipleshipJourneySection,
  discipleshipJourneySections,
} from "@/lib/discipleship-journey-content";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

type DashboardDiscipleshipJourneySeriesPageProps = {
  params: Promise<{
    seriesId: string;
  }>;
};

export function generateStaticParams() {
  return discipleshipJourneySections.map((section) => ({
    seriesId: section.id,
  }));
}

export default async function DashboardDiscipleshipJourneySeriesPage({
  params,
}: DashboardDiscipleshipJourneySeriesPageProps) {
  const { seriesId } = await params;
  const appSession = await getAppSession();
  const cookieStore = await cookies();
  const welcomeSession = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  if (!appSession && welcomeSession) {
    redirect(
      `/api/welcome-access/session?returnTo=%2Fdashboard%2Fdiscipleship-journey%2F${seriesId}`,
    );
  }

  if (!appSession) {
    redirect("/welcome");
  }

  const section = getDiscipleshipJourneySection(seriesId);

  if (!section) {
    notFound();
  }

  return <DiscipleshipJourneySeriesPage section={section} />;
}
