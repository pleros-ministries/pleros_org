import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscipleshipJourneySeriesPage } from "@/components/dashboard/discipleship-journey-series-page";
import {
  getDiscipleshipJourneySection,
  discipleshipJourneySections,
} from "@/lib/discipleship-journey-content";

export const metadata: Metadata = {
  title: "Discipleship Journey series preview",
  robots: {
    index: false,
    follow: false,
  },
};

type DiscipleshipJourneySeriesPreviewPageProps = {
  params: Promise<{
    seriesId: string;
  }>;
};

export function generateStaticParams() {
  return discipleshipJourneySections.map((section) => ({
    seriesId: section.id,
  }));
}

export default async function DiscipleshipJourneySeriesPreviewPage({
  params,
}: DiscipleshipJourneySeriesPreviewPageProps) {
  const { seriesId } = await params;
  const section = getDiscipleshipJourneySection(seriesId);
  const previewHrefPrefix = "/preview/dashboard/discipleship-journey";

  if (!section) {
    notFound();
  }

  return (
    <DiscipleshipJourneySeriesPage
      section={section}
      backHref={previewHrefPrefix}
    />
  );
}
