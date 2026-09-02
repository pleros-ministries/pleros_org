import { discipleshipFoundationsVideos } from "../discipleship-foundations-content";
import { purposePathwayVideos } from "../purpose-pathway-content";
import { questionsSeriesPages } from "../questions-pathway-content";

import {
  buildPreparationDateKeys,
  PRE_SOGP_PREPARATION_DAYS,
} from "./calendar";

type SeedVideo = {
  title: string;
  description: string;
  href: string;
};

function seriesVideos(slug: string): SeedVideo[] {
  return questionsSeriesPages.find((series) => series.slug === slug)?.videos ?? [];
}

export function buildPreSogpSeed(preparationStartsAt: Date) {
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
  if (unique.length < PRE_SOGP_PREPARATION_DAYS) {
    throw new Error(
      `At least ${PRE_SOGP_PREPARATION_DAYS} unique hosted teachings are required.`,
    );
  }
  const dateKeys = buildPreparationDateKeys(preparationStartsAt);
  return unique.slice(0, PRE_SOGP_PREPARATION_DAYS).map((video, index) => ({
    dayNumber: index + 1,
    publishDate: dateKeys[index]!,
    countdownLabel: `Day ${index + 1} of ${PRE_SOGP_PREPARATION_DAYS}`,
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
  if (
    input.preparationCount !== PRE_SOGP_PREPARATION_DAYS ||
    input.uniquePreparationUrlCount !== PRE_SOGP_PREPARATION_DAYS
  ) {
    issues.push(
      `Add exactly ${PRE_SOGP_PREPARATION_DAYS} unique Pre-SOGP lessons.`,
    );
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
