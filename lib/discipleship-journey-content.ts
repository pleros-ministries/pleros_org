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
  videos: DiscipleshipJourneyVideoItem[];
};

function getSeriesVideos(slug: string): DiscipleshipJourneyVideoItem[] {
  return questionsSeriesPages.find((page) => page.slug === slug)?.videos ?? [];
}

export const discipleshipJourneySections: DiscipleshipJourneySection[] = [
  {
    id: "most-important-questions",
    title: "Most Important Questions",
    videos: getSeriesVideos("most-important-questions-series"),
  },
  {
    id: "gospel-answers-simple",
    title: "Gospel Answers (Simple Version)",
    videos: getSeriesVideos("gospel-answers-simple-series"),
  },
  {
    id: "discover-purpose",
    title: "Discover Purpose",
    videos: purposePathwayVideos,
  },
].filter((section) => section.videos.length > 0);
