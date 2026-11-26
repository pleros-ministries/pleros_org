import Link from "next/link";
import { TrophyIcon } from "lucide-react";

import styles from "./learning-hub.module.css";

export type LeaderboardPreviewData = { top: Array<{ rank: number; name: string; points: number; isMe: boolean }>; me: { rank: number; points: number } | null; total: number };

/** The board's top few, and you if you're further down, with "See all". Used on Home. */
export function LeaderboardPreview({ board, id, dense = false, month }: { board: LeaderboardPreviewData; id: string;
  /** Home: smaller rows and only the top three, plus you. */
  dense?: boolean;
  /** The monthly board's month ("November"); without it, the cohort board. */
  month?: string }) {
  const top = dense ? board.top.slice(0, 3) : board.top;
  const outsideTop = board.me && !top.some(row => row.isMe) ? board.me : null;
  const scope = month ? `in ${month}` : "in your cohort";
  return <section className={styles.board} data-dense={dense || undefined} aria-labelledby={id}>
    <header className={styles.boardHead}>
      <span className={styles.boardIcon} aria-hidden="true"><TrophyIcon className="size-4" strokeWidth={2.2} /></span>
      <span className={styles.rowCopy}>
        <h2 id={id}>Leaderboard</h2>
        <span className={styles.rowMeta}>{board.me ? `You’re #${board.me.rank} of ${board.total} ${month ? scope + " " : ""}· ${board.me.points} pts` : `Top of ${board.total} ${scope}`}</span>
      </span>
      <Link href={month ? "/dashboard/leaderboard" : "/dashboard/sogp/leaderboard"} className={styles.boardAll}>See all</Link>
    </header>
    <ol className={styles.boardList}>
      {top.map((row, index) => <li key={`${index}-${row.rank}`} className={styles.boardRow} data-me={row.isMe || undefined}>
        <span className={styles.boardRank} data-rank={row.rank <= 3 ? row.rank : undefined}>{row.rank}</span>
        <span className={styles.boardName}>{row.isMe ? "You" : row.name}</span>
        <span className={styles.boardPts}>{row.points}<small> pts</small></span>
      </li>)}
      {outsideTop ? <li className={`${styles.boardRow} ${outsideTop.rank > (top.at(-1)?.rank ?? 0) + 1 ? styles.boardGap : ""}`} data-me>
        <span className={styles.boardRank}>{outsideTop.rank}</span>
        <span className={styles.boardName}>You</span>
        <span className={styles.boardPts}>{outsideTop.points}<small> pts</small></span>
      </li> : null}
    </ol>
  </section>;
}
