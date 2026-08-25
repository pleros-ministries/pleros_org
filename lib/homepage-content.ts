import type { PathwayKey } from "./homepage-logic";

export type HeroSlide = {
  id: string;
  question: string;
  pathway: PathwayKey;
};

export type PathwayCard = {
  key: PathwayKey;
  title: string;
  mobileDescription: string;
  description: string;
  href: string;
  themeClass: "theme-questions" | "theme-purpose" | "theme-fulfil";
  badgeVariant: "questions" | "purpose" | "fulfil";
};

export type PodcastEpisode = {
  title: string;
  duration: string;
  date: string;
  platform: string;
  href: string;
};

export type LibraryPreview = {
  id: string;
  title: string;
  topic: string;
  length: string;
};

export type SocialShellItem = {
  id: string;
  platform: string;
  handle: string;
  note: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "prompt-1",
    question: "Ever wondered whether God is real?",
    pathway: "questions",
  },
  {
    id: "prompt-2",
    question: "Want to understand God's Word better?",
    pathway: "fulfil",
  },
  {
    id: "prompt-3",
    question: "Want to know God's purpose for your life?",
    pathway: "purpose",
  },
  {
    id: "prompt-4",
    question: "Carrying questions you've never voiced out loud?",
    pathway: "questions",
  },
  {
    id: "prompt-5",
    question: "Ready to grow in prayer, the Word, and spiritual discipline?",
    pathway: "fulfil",
  },
  {
    id: "prompt-6",
    question: "Sense that there is more to your life in God?",
    pathway: "purpose",
  },
];

export const pathwayCards: PathwayCard[] = [
  {
    key: "questions",
    title: "Explore Questions",
    mobileDescription: "Answers for Gospel questions.",
    description: "Answers to your doubts or questions about God and the Gospel.",
    href: "/questions",
    themeClass: "theme-questions",
    badgeVariant: "questions",
  },
  {
    key: "purpose",
    title: "Discover Purpose",
    mobileDescription: "Grow to discover calling.",
    description:
      "Start your journey of growth to fulfil God's purpose for your life.",
    href: "/purpose",
    themeClass: "theme-purpose",
    badgeVariant: "purpose",
  },
  {
    key: "fulfil",
    title: "Fulfil Purpose",
    mobileDescription: "Follow God with clarity.",
    description: "Find out what God's purpose for your life really is.",
    href: "/fulfil",
    themeClass: "theme-fulfil",
    badgeVariant: "fulfil",
  },
];

export const latestPodcastEpisode: PodcastEpisode = {
  title: "Walking with clarity in God's Word",
  duration: "38 min",
  date: "March 2026",
  platform: "Pleros Podcast",
  href: "/podcast",
};

export const libraryPreviews: LibraryPreview[] = [
  {
    id: "lib-prayer",
    title: "Prayer that sustains purpose",
    topic: "Prayer",
    length: "24 min audio",
  },
  {
    id: "lib-word",
    title: "Growing through the Word daily",
    topic: "Word",
    length: "31 min audio",
  },
  {
    id: "lib-identity",
    title: "Identity and assignment in Christ",
    topic: "Purpose",
    length: "27 min audio",
  },
];

export const socialShellItems: SocialShellItem[] = [
  {
    id: "social-instagram",
    platform: "Instagram",
    handle: "@plerosministries",
    note: "Embed shell ready",
  },
  {
    id: "social-youtube",
    platform: "YouTube",
    handle: "Pleros Ministries",
    note: "Video highlight shell",
  },
  {
    id: "social-tiktok",
    platform: "TikTok",
    handle: "@plerosmissions",
    note: "Shorts shell",
  },
];
