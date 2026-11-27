import type { Metadata } from "next";

import { PodcastProgressPage } from "@/components/dashboard/podcast-progress-page";
import type { RssEpisode } from "@/lib/anchor-rss";
import { PODCAST_FOUNDATIONS_TRACK } from "@/lib/podcast-journey";

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
  ...previewFoundationsEpisodes(),
];

/** The opening of the Foundations journey, so the preview shows a plan in progress. */
function previewFoundationsEpisodes(): RssEpisode[] {
  const parts = [
    ["The Place of the Gospel in Your Life", 4, "2026-01-15"],
    ["The Reality of God's Purpose", 3, "2026-01-17"],
  ] as const;

  return parts.flatMap(([series, count, firstDate]) =>
    Array.from({ length: count }, (_, index) => {
      const slug = series.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const date = new Date(`${firstDate}T05:00:00.000Z`);
      date.setUTCDate(date.getUTCDate() + index);
      return {
        guid: `${slug}-${index + 1}`,
        title: `${series} (Part ${index + 1})`,
        link: `https://example.com/${slug}-${index + 1}`,
        audioUrl: `https://example.com/${slug}-${index + 1}.mp3`,
        duration: "00:16:00",
        pubDate: date.toUTCString(),
        isoDate: date.toISOString().slice(0, 10),
        imageUrl: "",
        description: "",
        episodeNumber: null,
      };
    }),
  );
}

// The preview is pinned to the fixture's dates so its calendar always has
// episodes to show.
const previewPodcastLeaderboard = {
  month: "July",
  top: [
    { rank: 1, name: "Ada", points: 71, isMe: false },
    { rank: 2, name: "Tunde", points: 54, isMe: false },
    { rank: 3, name: "Preview", points: 9, isMe: true },
  ],
  me: { rank: 3, points: 9 },
  total: 3,
  points: 9,
};

export default function PodcastDashboardPreviewPage() {
  return (
    <PodcastProgressPage
      episodes={previewPodcastEpisodes}
      listenedEpisodeGuids={[
        "righteous-nature-23",
        "the-place-of-the-gospel-in-your-life-1",
        "the-place-of-the-gospel-in-your-life-2",
      ]}
      todayKey="2026-07-13"
      calendarStartKey="2026-07-01"
      calendarEndKey="2026-07-31"
      prayerDateKeys={["2026-07-11", "2026-07-12"]}
      listenerName="Preview"
      leaderboard={previewPodcastLeaderboard}
      track={PODCAST_FOUNDATIONS_TRACK}
      startedOn="2026-07-10"
      previewMode
    />
  );
}
