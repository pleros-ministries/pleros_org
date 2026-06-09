import { homeYoutubeChannelUrl } from "./site-homepage-content";

export type QuestionsPathwayHero = {
  title: string;
  description: string;
  illustrationSrc: string;
};

export type QuestionsPathwayVideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  playIconSrc: string;
  href: string;
};

export type QuestionsSeriesPage = {
  slug: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  playIconSrc: string;
  videos: QuestionsPathwayVideoItem[];
};

export type QuestionsPathwaySeriesItem = {
  title: string;
  description: string;
  thumbnailSrc: string;
  playIconSrc: string;
  href: string;
};

export const questionsPathwayHero: QuestionsPathwayHero = {
  title: "Find Answers",
  description: "Do you have doubts about God and/or the Gospel?",
  illustrationSrc: "/site/home/assets/questions-pathway/question-header-icon.png",
};

const sharedPlayIconSrc =
  "/site/home/assets/questions-pathway/video-circle-icon.png";

const sharedSeriesDescription =
  "Your daily dose of God's Word helping you fulfil God's purpose";

function buildDriveThumbnailSrc(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
}

function buildYoutubeThumbnailSrc(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function buildYoutubeEmbedSrc(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

const mostImportantQuestionsVideos: QuestionsPathwayVideoItem[] = [
  {
    id: "most-important-questions-1",
    title: "The Most Important Question",
    description: sharedSeriesDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1jVbUwpPqsdS7vPuK9bxDHymu_dDNB2Vm/preview",
  },
  {
    id: "most-important-questions-2",
    title: "Baptism of the Holy Ghost",
    description: sharedSeriesDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1XMNOYIeoM2zrdU8de0Hya9jUSCJbH-5P"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1XMNOYIeoM2zrdU8de0Hya9jUSCJbH-5P/preview",
  },
  {
    id: "most-important-questions-3",
    title: "Healing",
    description: sharedSeriesDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1TM2HYuYZi8ktffPxKh6dMfprJX1LgdJC"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1TM2HYuYZi8ktffPxKh6dMfprJX1LgdJC/preview",
  },
  {
    id: "most-important-questions-4",
    title: "Local Church",
    description: sharedSeriesDescription,
    thumbnailSrc: buildDriveThumbnailSrc("113AZNjAi1ljK2vlWExEHcYASWhGokcrF"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/113AZNjAi1ljK2vlWExEHcYASWhGokcrF/preview",
  },
  {
    id: "most-important-questions-5",
    title: "Salvation",
    description: sharedSeriesDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1YJZKpT6vDrikezN3eexDYTjKTtpaPB-W"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1YJZKpT6vDrikezN3eexDYTjKTtpaPB-W/preview",
  },
];

const gospelAnswersSimpleVideos: QuestionsPathwayVideoItem[] = [
  {
    id: "gospel-answers-simple-1",
    title: "Gospel Answers Series 1",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("8iZGdhWZr-s"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("8iZGdhWZr-s"),
  },
  {
    id: "gospel-answers-simple-2",
    title: "Gospel Answers Series 2",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("Bv52zyEpz5o"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("Bv52zyEpz5o"),
  },
  {
    id: "gospel-answers-simple-3",
    title: "Gospel Answers Series 3",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("ENjNA5TOspw"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("ENjNA5TOspw"),
  },
  {
    id: "gospel-answers-simple-4",
    title: "Gospel Answers Series 4",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("o6Vpc6-RcBs"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("o6Vpc6-RcBs"),
  },
  {
    id: "gospel-answers-simple-5",
    title: "Gospel Answers Series 5",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("17XTOWErqYs"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("17XTOWErqYs"),
  },
  {
    id: "gospel-answers-simple-6",
    title: "Gospel Answers Series 6",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("ZiRJKjiLP3o"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("ZiRJKjiLP3o"),
  },
  {
    id: "gospel-answers-simple-7",
    title: "Gospel Answers Series 7",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("2vpU7QwCmkk"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("2vpU7QwCmkk"),
  },
  {
    id: "gospel-answers-simple-8",
    title: "Gospel Answers Series 8",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("qeAvE4pVLpU"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("qeAvE4pVLpU"),
  },
  {
    id: "gospel-answers-simple-9",
    title: "Gospel Answers Series 9",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("6qzseFmF-HQ"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("6qzseFmF-HQ"),
  },
  {
    id: "gospel-answers-simple-10",
    title: "Gospel Answers Series 10",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("0pQ_hFOlOXM"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("0pQ_hFOlOXM"),
  },
  {
    id: "gospel-answers-simple-11",
    title: "Gospel Answers Series 11",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("oj_orHsQtb0"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("oj_orHsQtb0"),
  },
  {
    id: "gospel-answers-simple-12",
    title: "Gospel Answers Series 12",
    description: sharedSeriesDescription,
    thumbnailSrc: buildYoutubeThumbnailSrc("lkxPTiPVIBo"),
    playIconSrc: sharedPlayIconSrc,
    href: buildYoutubeEmbedSrc("lkxPTiPVIBo"),
  },
];

function buildPlaceholderVideos(
  seriesKey: string,
  thumbnailSrc: string,
): QuestionsPathwayVideoItem[] {
  return [
    {
      id: `${seriesKey}-intro-1`,
      title: "Introduction to the Series",
      description: sharedSeriesDescription,
      thumbnailSrc,
      playIconSrc: sharedPlayIconSrc,
      href: homeYoutubeChannelUrl,
    },
    {
      id: `${seriesKey}-intro-2`,
      title: "Introduction to the Series",
      description: sharedSeriesDescription,
      thumbnailSrc,
      playIconSrc: sharedPlayIconSrc,
      href: homeYoutubeChannelUrl,
    },
  ];
}

export const questionsSeriesPages: QuestionsSeriesPage[] = [
  {
    slug: "most-important-questions-series",
    title: "Most Important Questions Series",
    description: questionsPathwayHero.description,
    thumbnailSrc:
      "/site/home/assets/questions-pathway/thumbnails/most-important-questions-series.png",
    playIconSrc: sharedPlayIconSrc,
    videos: mostImportantQuestionsVideos,
  },
  {
    slug: "gospel-answers-simple-series",
    title: "Gospel Answers Series (Simple Version)",
    description: questionsPathwayHero.description,
    thumbnailSrc:
      "/site/home/assets/questions-pathway/thumbnails/gospel-answers-simple-series.png",
    playIconSrc: sharedPlayIconSrc,
    videos: gospelAnswersSimpleVideos,
  },
  {
    slug: "gospel-answers-critical-series",
    title: "Gospel Answers Series (Critical Version)",
    description: questionsPathwayHero.description,
    thumbnailSrc:
      "/site/home/assets/questions-pathway/thumbnails/gospel-answers-critical-series.png",
    playIconSrc: sharedPlayIconSrc,
    videos: buildPlaceholderVideos(
      "gospel-answers-critical-series",
      "/site/home/assets/questions-pathway/thumbnails/gospel-answers-critical-series.png",
    ),
  },
];

export const questionsPathwaySeries: QuestionsPathwaySeriesItem[] =
  questionsSeriesPages.map(
    ({ slug, title, thumbnailSrc, playIconSrc }) => ({
      title,
      description: sharedSeriesDescription,
      thumbnailSrc,
      playIconSrc,
      href: `/questions/${slug}`,
    }),
  );

export function getQuestionsSeriesPage(slug: string): QuestionsSeriesPage | null {
  return questionsSeriesPages.find((page) => page.slug === slug) ?? null;
}
