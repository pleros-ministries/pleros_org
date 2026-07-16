import type { Metadata } from "next";

import { PrayerWatchPage } from "@/components/dashboard/prayer-watch-page";

export const metadata: Metadata = {
  title: "Prayer Watch dashboard preview",
  robots: {
    index: false,
    follow: false,
  },
};

const bibleReadingLogs = [
  {
    dateKey: "2026-07-01",
    chaptersRead: 4,
    currentBook: "Matthew",
    currentChapter: 4,
  },
  {
    dateKey: "2026-07-03",
    chaptersRead: 5,
    currentBook: "Matthew",
    currentChapter: 9,
  },
  {
    dateKey: "2026-07-06",
    chaptersRead: 3,
    currentBook: "Matthew",
    currentChapter: 12,
  },
];

export default function PrayerWatchDashboardPreviewPage() {
  return (
    <PrayerWatchPage
      year={2026}
      month={6}
      todayKey="2026-07-13"
      attendedDateKeys={["2026-07-01", "2026-07-03", "2026-07-06"]}
      bibleReadingLogs={bibleReadingLogs}
    />
  );
}
