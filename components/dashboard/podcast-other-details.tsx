import { ChevronRightIcon, SunIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";

import { LeaderboardPreview } from "@/components/sogp/learning/leaderboard-preview";
import type { previewMonthlyLeaderboard } from "@/lib/leaderboard/monthly";
import type {
  PodcastJourneySummary,
  PodcastProgressSummary,
} from "@/lib/podcast-journey";

import styles from "./podcast.module.css";

/** Progress at a glance: the Oversight-style strip of three numbers. */
export function PodcastProgressStrip({
  summary,
  journeySummary,
}: {
  summary: PodcastProgressSummary;
  /** Present while the listener follows a journey rather than new releases. */
  journeySummary: PodcastJourneySummary | null;
}) {
  const items: Array<[string, string]> = [
    journeySummary
      ? ["Journey", `${journeySummary.listened}/${journeySummary.totalDays}`]
      : ["This month", `${summary.monthEpisodesListened}/${summary.monthEpisodesTotal}`],
    ["Prayer Watch", `${summary.prayerPercent}%`],
    ["All episodes", `${summary.episodesListened}/${summary.episodesTotal}`],
  ];

  return (
    <div className={styles.strip} aria-label="Podcast progress">
      {items.map(([label, value]) => (
        <div key={label}>
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/** This month's board for everyone, and the way into the rest of Prayer Watch. */
export function PodcastOtherDetails({
  leaderboard,
  previewMode,
}: {
  leaderboard: ReturnType<typeof previewMonthlyLeaderboard> | null;
  previewMode: boolean;
}) {
  const boardHref = previewMode ? "/preview/dashboard-v3/monthly-leaderboard" : "/dashboard/leaderboard";
  return (
    <>
      {leaderboard?.top.length ? (
        <LeaderboardPreview board={leaderboard} id="podcast-leaderboard" month={leaderboard.month} href={boardHref} />
      ) : null}

      <ul className={`${styles.panel} ${styles.list}`}>
        {/* Before anyone has points this month, the board is one quiet row. */}
        {leaderboard && !leaderboard.top.length ? (<li>
          <Link href={boardHref} className={styles.row}>
            <span className={styles.chip} data-tone="amber" aria-hidden="true">
              <TrophyIcon className="size-4" strokeWidth={2} />
            </span>
            <span className={styles.rowCopy}>
              <span className={styles.rowTitle}>Leaderboard</span>
              <span className={styles.rowMeta}>
                {leaderboard.points ? `${leaderboard.points} points in ${leaderboard.month}` : `Your first activity in ${leaderboard.month} puts you on it`}
              </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" />
          </Link>
        </li>) : null}
        <li><Link
          href={previewMode ? "/preview/dashboard/prayer-watch" : "/dashboard/prayer-watch"}
          className={styles.row}
        >
          <span className={styles.chip} data-tone="amber" aria-hidden="true">
            <SunIcon className="size-4" strokeWidth={2} />
          </span>
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>Prayer Watch</span>
            <span className={styles.rowMeta}>
              Afternoon and evening watches, and your Bible reading
            </span>
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" />
        </Link></li>
      </ul>
    </>
  );
}
