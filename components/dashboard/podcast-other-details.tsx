import { ChevronRightIcon, SunIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";

import type {
  PodcastJourneySummary,
  PodcastProgressSummary,
} from "@/lib/podcast-journey";
import type { PodcastLeaderboardData } from "@/lib/podcast-leaderboard";

import styles from "./podcast.module.css";
import { PodcastLeaderboardToggle } from "./podcast-leaderboard-toggle";

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

function PodcastLeaderboardWidget({
  data,
  previewMode,
}: {
  data: PodcastLeaderboardData;
  previewMode: boolean;
}) {
  const top = data.top.slice(0, 5);
  const outsideTop = data.me?.visible && !top.some((entry) => entry.isMe) ? data.me : null;
  const meta = data.me
    ? data.me.visible
      ? `You’re #${data.me.rank} · ${data.me.points} pts · ${data.monthLabel}`
      : `Only you see your #${data.me.rank} · ${data.me.points} pts`
    : `${data.monthLabel} · mark an episode to earn points`;

  return (
    <section className={styles.board} aria-labelledby="podcast-leaderboard">
      <header className={styles.boardHead}>
        <span className={styles.boardIcon} aria-hidden="true">
          <TrophyIcon className="size-4" strokeWidth={2.2} />
        </span>
        <span className={styles.rowCopy}>
          <h2 id="podcast-leaderboard">Leaderboard</h2>
          <span className={styles.rowMeta}>{meta}</span>
        </span>
        {previewMode ? null : (
          <Link href="/dashboard/podcast/leaderboard" className={styles.boardAll}>
            See all
          </Link>
        )}
      </header>
      {top.length > 0 ? (
        <ol className={styles.boardList}>
          {top.map((entry, index) => (
            <li
              key={`${entry.rank}-${index}`}
              className={styles.boardRow}
              data-me={entry.isMe || undefined}
            >
              <span
                className={styles.boardRank}
                data-rank={entry.rank <= 3 ? entry.rank : undefined}
              >
                {entry.rank}
              </span>
              <span className={styles.boardName}>{entry.isMe ? "You" : entry.name}</span>
              <span className={styles.boardPts}>
                {entry.points}
                <small> pts</small>
              </span>
            </li>
          ))}
          {outsideTop ? (
            <li className={styles.boardRow} data-me>
              <span className={styles.boardRank}>{outsideTop.rank}</span>
              <span className={styles.boardName}>You</span>
              <span className={styles.boardPts}>
                {outsideTop.points}
                <small> pts</small>
              </span>
            </li>
          ) : null}
        </ol>
      ) : (
        <p className={styles.boardText}>No one is on the leaderboard yet.</p>
      )}
      <div className={styles.boardFoot}>
        <PodcastLeaderboardToggle visible={data.viewerVisible} previewMode={previewMode} />
      </div>
    </section>
  );
}

/** The leaderboard preview and the way into the rest of Prayer Watch. */
export function PodcastOtherDetails({
  leaderboard,
  previewMode,
}: {
  leaderboard: PodcastLeaderboardData | null;
  previewMode: boolean;
}) {
  return (
    <>
      {leaderboard ? (
        <PodcastLeaderboardWidget data={leaderboard} previewMode={previewMode} />
      ) : null}

      <div className={styles.panel}>
        <Link
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
        </Link>
      </div>
    </>
  );
}
