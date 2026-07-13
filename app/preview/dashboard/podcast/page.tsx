import type { Metadata } from "next";

import { PodcastProgressPage } from "@/components/dashboard/podcast-progress-page";
import type { RssEpisode } from "@/lib/anchor-rss";

export const metadata: Metadata = {
  title: "Podcast progress dashboard preview",
  robots: {
    index: false,
    follow: false,
  },
};

const previewPodcastEpisodes: RssEpisode[] = [
  {
    guid: "righteous-nature-24",
    title: "Our Righteous Nature in Christ (Part 24)",
    link: "https://example.com/righteous-nature-24",
    audioUrl: "https://example.com/righteous-nature-24.mp3",
    duration: "00:17:08",
    pubDate: "Mon, 13 Jul 2026 00:00:00 GMT",
    isoDate: "2026-07-13",
    imageUrl: "",
    description: "",
    episodeNumber: 180,
  },
  {
    guid: "righteous-nature-23",
    title: "Our Righteous Nature in Christ (Part 23)",
    link: "https://example.com/righteous-nature-23",
    audioUrl: "https://example.com/righteous-nature-23.mp3",
    duration: "00:15:44",
    pubDate: "Sun, 12 Jul 2026 00:00:00 GMT",
    isoDate: "2026-07-12",
    imageUrl: "",
    description: "",
    episodeNumber: 179,
  },
  {
    guid: "faith-stand-1",
    title: "Faith Stand - Part 1",
    link: "https://example.com/faith-stand-1",
    audioUrl: "https://example.com/faith-stand-1.mp3",
    duration: "00:13:20",
    pubDate: "Sat, 11 Jul 2026 00:00:00 GMT",
    isoDate: "2026-07-11",
    imageUrl: "",
    description: "",
    episodeNumber: 178,
  },
];

export default function PodcastDashboardPreviewPage() {
  return (
    <PodcastProgressPage
      episodes={previewPodcastEpisodes}
      listenedEpisodeGuids={["righteous-nature-23"]}
      previewMode
    />
  );
}
