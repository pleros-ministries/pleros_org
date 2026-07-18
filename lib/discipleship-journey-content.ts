import { purposePathwayVideos } from "./purpose-pathway-content";
import { questionsSeriesPages } from "./questions-pathway-content";

export type DiscipleshipJourneyVideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  playIconSrc: string;
  href: string;
};

export type DiscipleshipJourneySection = {
  id: string;
  title: string;
  thumbnailSrc: string;
  videos: DiscipleshipJourneyVideoItem[];
};

export type DiscipleshipJourneySeriesCard = {
  id: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  href: string;
  videoCount: number;
};

function getSeriesVideos(slug: string): DiscipleshipJourneyVideoItem[] {
  return questionsSeriesPages.find((page) => page.slug === slug)?.videos ?? [];
}

function getSeriesThumbnailSrc(slug: string): string {
  return questionsSeriesPages.find((page) => page.slug === slug)?.thumbnailSrc ?? "";
}

export const discipleshipJourneySections: DiscipleshipJourneySection[] = [
  {
    id: "most-important-questions",
    title: "Most Important Questions",
    thumbnailSrc: getSeriesThumbnailSrc("most-important-questions-series"),
    videos: getSeriesVideos("most-important-questions-series"),
  },
  {
    id: "gospel-answers-simple",
    title: "Gospel Answers (Simple Version)",
    thumbnailSrc: getSeriesVideos("gospel-answers-simple-series")[0]?.thumbnailSrc ?? "",
    videos: getSeriesVideos("gospel-answers-simple-series"),
  },
  {
    id: "discover-purpose",
    title: "Discover Purpose",
    thumbnailSrc: "/site/home/assets/pathway-card-headers/purpose-thumbnail.webp",
    videos: purposePathwayVideos,
  },
].filter((section) => section.videos.length > 0);

export function getDiscipleshipJourneySection(
  id: string,
): DiscipleshipJourneySection | null {
  return discipleshipJourneySections.find((section) => section.id === id) ?? null;
}

export function getDiscipleshipJourneySeriesCards(
  hrefPrefix = "/dashboard/discipleship-journey",
): DiscipleshipJourneySeriesCard[] {
  return discipleshipJourneySections.map((section) => ({
    id: section.id,
    title: section.title,
    description:
      section.videos[0]?.description ??
      "Teaching series to help you walk in God's purpose.",
    thumbnailSrc: section.thumbnailSrc,
    href: `/dashboard/discipleship-journey/${section.id}`.replace(
      "/dashboard/discipleship-journey",
      hrefPrefix,
    ),
    videoCount: section.videos.length,
  }));
}
