import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QuestionsSeriesPageView } from "../../../../components/home/questions-series-page-view";
import {
  getQuestionsSeriesPage,
  questionsSeriesPages,
} from "../../../../lib/questions-pathway-content";

type QuestionsSeriesPageProps = {
  params: Promise<{
    seriesSlug: string;
  }>;
};

export function generateStaticParams() {
  return questionsSeriesPages.map(({ slug }) => ({
    seriesSlug: slug,
  }));
}

export async function generateMetadata({
  params,
}: QuestionsSeriesPageProps): Promise<Metadata> {
  const { seriesSlug } = await params;
  const series = getQuestionsSeriesPage(seriesSlug);

  if (!series) {
    return {
      title: "Questions | Pleros",
    };
  }

  return {
    title: `${series.title} | Pleros`,
    description: series.description,
  };
}

export default async function QuestionsSeriesPage({
  params,
}: QuestionsSeriesPageProps) {
  const { seriesSlug } = await params;
  const series = getQuestionsSeriesPage(seriesSlug);

  if (!series) {
    notFound();
  }

  return <QuestionsSeriesPageView series={series} />;
}
