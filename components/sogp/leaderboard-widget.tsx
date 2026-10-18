"use client";

import { useQuery } from "@tanstack/react-query";
import { TrophyIcon } from "lucide-react";
import Link from "next/link";

import { fetchLeaderboard, LEADERBOARD_QUERY_KEY } from "./leaderboard-page";
import styles from "./learning-tools.module.css";

/** The compact leaderboard card from the Learning hub: top five, medal tints, your row pinned. */
export function LeaderboardWidget() {
  const { data } = useQuery({
    queryKey: LEADERBOARD_QUERY_KEY,
    queryFn: fetchLeaderboard,
  });

  if (!data) return null;

  const top = data.top.slice(0, 5);
  const outsideTop = data.me && !top.some((entry) => entry.isMe) ? data.me : null;

  return (
    <section className={styles.board} aria-labelledby="sogp-leaderboard-widget">
      <header className={styles.boardHead}>
        <span className={styles.boardIcon} aria-hidden="true">
          <TrophyIcon className="size-4" strokeWidth={2.2} />
        </span>
        <span className={styles.rowCopy}>
          <h2 id="sogp-leaderboard-widget">Leaderboard</h2>
          <span className={styles.rowMeta}>
            {data.me ? `You’re #${data.me.rank} · ${data.me.points} pts` : `Top of ${data.total} in your cohort`}
          </span>
        </span>
        <Link href="/dashboard/sogp/leaderboard" className={styles.textBtn}>
          See all
        </Link>
      </header>
      {top.length > 0 ? (
        <ol className={styles.boardList}>
          {top.map((entry, index) => (
            <li key={`${entry.rank}-${index}`} className={styles.boardRow} data-me={entry.isMe || undefined}>
              <span className={styles.boardRank} data-rank={entry.rank <= 3 ? entry.rank : undefined}>{entry.rank}</span>
              <span className={styles.boardName}>{entry.isMe ? "You" : entry.name}</span>
              <span className={styles.boardPts}>{entry.points}<small> pts</small></span>
            </li>
          ))}
          {outsideTop ? (
            <li className={styles.boardRow} data-me style={{ marginTop: 6 }}>
              <span className={styles.boardRank}>{outsideTop.rank}</span>
              <span className={styles.boardName}>You</span>
              <span className={styles.boardPts}>{outsideTop.points}<small> pts</small></span>
            </li>
          ) : null}
        </ol>
      ) : (
        <p className={styles.empty}>No one is on the leaderboard yet.</p>
      )}
    </section>
  );
}
