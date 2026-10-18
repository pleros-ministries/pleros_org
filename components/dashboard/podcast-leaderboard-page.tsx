import { TrophyIcon } from "lucide-react";

import {
  PODCAST_LEADERBOARD_POINTS,
  type PodcastLeaderboardData,
} from "@/lib/podcast-leaderboard";
import { LEADERBOARD_STREAK_MILESTONE_DAYS } from "@/lib/sogp/leaderboard-scoring";

import styles from "./podcast.module.css";
import { PodcastLeaderboardToggle } from "./podcast-leaderboard-toggle";

const POINT_RULES: Array<{ label: string; value: string }> = [
  {
    label: "Each day you listen to an episode",
    value: `${PODCAST_LEADERBOARD_POINTS.listeningDay}`,
  },
  {
    label: "5:30 am Prayer Watch",
    value: `${PODCAST_LEADERBOARD_POINTS.prayerWatch}`,
  },
  {
    label: `Streak bonus every ${LEADERBOARD_STREAK_MILESTONE_DAYS} days in a row`,
    value: `${PODCAST_LEADERBOARD_POINTS.streakMilestone}`,
  },
];

function streakLabel(days: number) {
  return days > 0 ? `${days}-day streak` : null;
}

export function PodcastLeaderboardPage({ data }: { data: PodcastLeaderboardData }) {
  const me = data.me;
  const listeners = `${data.total} ${data.total === 1 ? "listener" : "listeners"}`;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1>Leaderboard</h1>
          <p className={styles.sub}>
            Podcast · {data.monthLabel} · {listeners}
          </p>
        </div>
      </div>

      {me ? (
        <div className={styles.strip} aria-label="Your standing">
          <div>
            <strong>#{me.rank}</strong>
            <span>{me.visible ? "Your rank" : "Your rank, private"}</span>
          </div>
          <div>
            <strong>{me.points}</strong>
            <span>Points</span>
          </div>
          <div>
            <strong>{me.currentStreak}</strong>
            <span>Day streak</span>
          </div>
        </div>
      ) : null}

      <section className={styles.panel} aria-label="Your points">
        <div className={styles.panelPad}>
          {me ? (
            <p className={styles.helper}>
              Listening {me.breakdown.listening} · Prayer Watch {me.breakdown.prayer} · Streak
              bonus {me.breakdown.streak}
              {me.visible ? null : ". Only you can see this until you turn on the switch below."}
            </p>
          ) : (
            <p className={styles.helper}>Mark an episode as listened this month to earn points.</p>
          )}
        </div>
        <div className={styles.boardFoot}>
          <PodcastLeaderboardToggle visible={data.viewerVisible} />
        </div>
      </section>

      <section className={styles.board} aria-labelledby="podcast-ranking">
        <header className={styles.boardHead}>
          <span className={styles.boardIcon} aria-hidden="true">
            <TrophyIcon className="size-4" strokeWidth={2.2} />
          </span>
          <span className={styles.rowCopy}>
            <h2 id="podcast-ranking">This month’s ranking</h2>
            <span className={styles.rowMeta}>Starts afresh each month</span>
          </span>
        </header>
        {data.top.length === 0 ? (
          <p className={styles.boardText}>No one is on the leaderboard yet.</p>
        ) : (
          <ol className={styles.boardList}>
            {data.top.map((entry, index) => {
              const streak = streakLabel(entry.currentStreak);
              return (
                <li
                  key={`${entry.rank}-${index}`}
                  aria-current={entry.isMe ? "true" : undefined}
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
                  {streak ? <span className={styles.boardStreak}>{streak}</span> : null}
                  <span className={styles.boardPts}>
                    {entry.points}
                    <small> pts</small>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className={styles.sectionTitle}>
        <h2>How points work</h2>
      </div>
      <section className={styles.panel}>
        <ul className={styles.list}>
          {POINT_RULES.map((rule) => (
            <li key={rule.label} className={styles.row}>
              <span className={styles.rowCopy}>
                <span className="text-[13.5px] leading-[18px]">{rule.label}</span>
              </span>
              <span className={styles.pill} data-tone="done">
                +{rule.value}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <p className={styles.helper}>
        Points come from what you mark as done, so they update as you go. The leaderboard lists
        only listeners who choose to appear, by first name. A day counts once however many
        episodes you mark, on any journey.
      </p>
    </div>
  );
}
