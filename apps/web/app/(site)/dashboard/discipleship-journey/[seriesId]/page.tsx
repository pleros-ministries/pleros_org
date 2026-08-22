import { notFound } from "next/navigation";

import { DiscipleshipJourneySeriesPage } from "@/components/dashboard/discipleship-journey-series-page";
import {
  getDiscipleshipJourneySection,
  discipleshipJourneySections,
} from "@/lib/discipleship-journey-content";

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
  const section = getDiscipleshipJourneySection(seriesId);

  if (!section) {
    notFound();
  }

  return <DiscipleshipJourneySeriesPage section={section} />;
}
