import { discipleshipFoundationsVideos } from "../discipleship-foundations-content";
import { purposePathwayVideos } from "../purpose-pathway-content";
import { questionsSeriesPages } from "../questions-pathway-content";

import { buildPreparationDateKeys } from "./calendar";

type SeedVideo = {
  title: string;
  description: string;
  href: string;
};

function seriesVideos(slug: string): SeedVideo[] {
  return questionsSeriesPages.find((series) => series.slug === slug)?.videos ?? [];
}

export function buildPreSogpSeed(startsAt: Date) {
  const candidates: SeedVideo[] = [
    ...purposePathwayVideos,
    ...seriesVideos("gospel-answers-simple-series"),
    ...discipleshipFoundationsVideos,
    ...seriesVideos("most-important-questions-series"),
  ];
  const unique = candidates.filter(
    (candidate, index) =>
      candidates.findIndex((item) => item.href === candidate.href) === index,
  );
  if (unique.length < 30) {
    throw new Error("At least 30 unique hosted teachings are required.");
  }
  const dateKeys = buildPreparationDateKeys(startsAt);
  return unique.slice(0, 30).map((video, index) => ({
    dayNumber: index + 1,
    publishDate: dateKeys[index]!,
    countdownLabel: `${30 - index} day${30 - index === 1 ? "" : "s"} until SOGP begins`,
    introduction: video.description,
    title: video.title,
    url: video.href,
  }));
}

export function validateSogpLaunchReadiness(input: {
  preparationCount: number;
  uniquePreparationUrlCount: number;
  readyTrackCount: number;
  requiredReviewCount: number;
}) {
  const issues: string[] = [];
  if (input.preparationCount !== 30 || input.uniquePreparationUrlCount !== 30) {
    issues.push("Add exactly 30 unique Pre-SOGP lessons.");
  }
  if (input.readyTrackCount !== 24) {
    issues.push("Publish all 24 content-ready SOGP teachings.");
  }
  if (input.requiredReviewCount !== 4) {
    issues.push("Schedule four required review sessions.");
  }
  return issues;
}

export function isSogpLessonContentReady(lesson: {
  status: string;
  audioUrl: string | null;
  notesContent: string | null;
  responsePrompt: string | null;
  responseMarkingGuide: string | null;
  hasQuiz: boolean;
}) {
  return (
    lesson.status === "published" &&
    Boolean(
      lesson.audioUrl &&
        lesson.notesContent &&
        lesson.responsePrompt &&
        lesson.responseMarkingGuide &&
        lesson.hasQuiz,
    )
  );
}
