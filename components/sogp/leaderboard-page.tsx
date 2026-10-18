"use client";

import { useState, type CSSProperties } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { FlameIcon, TrophyIcon } from "lucide-react";

import type { LeaderboardData } from "@/lib/db/queries/sogp-leaderboard";
import {
  LEADERBOARD_POINTS,
  LEADERBOARD_SHARE_CAP,
  LEADERBOARD_STREAK_MILESTONE_DAYS,
} from "@/lib/sogp/leaderboard-scoring";

import styles from "./learning-tools.module.css";

export const LEADERBOARD_QUERY_KEY = ["sogp", "leaderboard"] as const;

export async function fetchLeaderboard() {
  const response = await fetch("/api/sogp/leaderboard", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("The leaderboard could not load.");
  return response.json() as Promise<LeaderboardData>;
}

const POINT_RULES: Array<{ label: string; value: string }> = [
  { label: "Passing a quiz", value: `${LEADERBOARD_POINTS.quizPassed}` },
  {
    label: "Written response approved",
    value: `${LEADERBOARD_POINTS.writtenApproved}`,
  },
  { label: "Completing a day", value: `${LEADERBOARD_POINTS.dayCompleted}` },
  {
    label: "Prayer Watch session",
    value: `${LEADERBOARD_POINTS.prayerWatch}`,
  },
  { label: "Sunday review", value: `${LEADERBOARD_POINTS.review}` },
  {
    label: "Pre-SOGP preparation day",
    value: `${LEADERBOARD_POINTS.preparationDay}`,
  },
  {
    label: `Sharing your progress (up to ${LEADERBOARD_SHARE_CAP} shares)`,
    value: `${LEADERBOARD_POINTS.share}`,
  },
  {
    label: "Each friend who enrols through your link",
    value: `${LEADERBOARD_POINTS.referral}`,
  },
  {
    label: `Streak bonus every ${LEADERBOARD_STREAK_MILESTONE_DAYS} days in a row`,
    value: `${LEADERBOARD_POINTS.streakMilestone}`,
  },
];

export function StreakBadge({ days }: { days: number }) {
  if (days < 1) return null;
  return (
    <span className={styles.streak}>
      <FlameIcon className="size-3" strokeWidth={2} aria-hidden />
      {days}-day streak
    </span>
  );
}

export function LeaderboardPage({
  initialData,
}: {
  initialData?: LeaderboardData;
} = {}) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: LEADERBOARD_QUERY_KEY,
    queryFn: fetchLeaderboard,
    initialData,
  });

  const [aliasDraft, setAliasDraft] = useState<string | null>(null);

  const alias = useMutation({
    mutationFn: async (value: string | null) => {
      const response = await fetch("/api/sogp/leaderboard/alias", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: value }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Your display name could not be saved.");
      }
    },
    onSuccess: () => setAliasDraft(null),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: LEADERBOARD_QUERY_KEY }),
  });

  const me = data.me;
  const breakdown = me
    ? [
        { label: "Course work", value: me.breakdown.course },
        { label: "Attendance", value: me.breakdown.attendance },
        { label: "Sharing and referrals", value: me.breakdown.sharing },
        { label: "Streak bonus", value: me.breakdown.streak },
      ]
    : [];

  return (
    <section className={styles.page}>
      {/* Navigation comes from the dashboard shell. */}
      <header className={styles.heading}>
        <h1>Leaderboard</h1>
        <p className={styles.sub}>
          {data.cohortTitle} · {data.total}{" "}
          {data.total === 1 ? "participant" : "participants"}
        </p>
      </header>

      {me ? (
        <>
          <div className={styles.strip} style={{ "--strip-count": 3 } as CSSProperties}>
            <div><span>Your rank</span><strong>#{me.rank}</strong></div>
            <div><span>Points</span><strong>{me.points}</strong></div>
            <div><span>Day streak</span><strong>{me.currentStreak}</strong></div>
          </div>
          {me.alias ? (
            <p className={styles.note}>Showing on the leaderboard as {me.alias}.</p>
          ) : null}
        </>
      ) : null}

      <section className={styles.board} aria-labelledby="sogp-leaderboard-ranking">
        <header className={styles.boardHead}>
          <span className={styles.boardIcon} aria-hidden="true">
            <TrophyIcon className="size-4" strokeWidth={2.2} />
          </span>
          <span className={styles.rowCopy}>
            <h2 id="sogp-leaderboard-ranking">Cohort ranking</h2>
            <span className={styles.rowMeta}>
              {me ? `You’re #${me.rank} of ${data.total}` : `Top of ${data.total} in your cohort`}
            </span>
          </span>
        </header>
        {data.top.length === 0 ? (
          <p className={styles.empty}>No one is on the leaderboard yet.</p>
        ) : (
          <ol className={styles.boardList}>
            {data.top.map((entry, index) => (
              <li
                key={`${entry.rank}-${index}`}
                aria-current={entry.isMe ? "true" : undefined}
                className={styles.boardRow}
                data-me={entry.isMe || undefined}
              >
                <span className={styles.boardRank} data-rank={entry.rank <= 3 ? entry.rank : undefined}>
                  {entry.rank}
                </span>
                <span className={styles.boardCopy}>
                  <span className={styles.boardName}>
                    {entry.name}
                    {entry.isMe ? " · You" : ""}
                  </span>
                  <StreakBadge days={entry.currentStreak} />
                </span>
                <span className={styles.boardPts}>
                  {entry.points}
                  <small> pts</small>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {me ? (
        <>
          <div className={styles.sectionTitle}><h2>Your points</h2></div>
          <div className={styles.panel}>
            <ul className={styles.list}>
              {breakdown.map((item) => (
                <li key={item.label} className={styles.row}>
                  <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.label}</span></span>
                  <span className={styles.rowValue}>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      <div className={styles.sectionTitle}><h2>How points work</h2></div>
      <div className={styles.panel}>
        <ul className={styles.list}>
          {POINT_RULES.map((rule) => (
            <li key={rule.label} className={styles.row} style={{ paddingBlock: 10 }}>
              <span className={styles.rowCopy}><span className={styles.rowMeta} style={{ fontSize: 13, color: "var(--color-text-strong)" }}>{rule.label}</span></span>
              <span className={styles.rowValue}>+{rule.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className={styles.note}>
        Points are worked out from your activity, so they update as you go. Withdrawn participants are not ranked. Scoring may be adjusted over
        time, which can change everyone&apos;s total.
      </p>

      {me ? (
        <>
          <div className={styles.sectionTitle}><h2>Display name</h2></div>
          <div className={styles.panel}>
            <div className={styles.panelBody}>
              <p className={styles.rowMeta}>
                Your full name is shown by default. Set a display name if you&apos;d rather appear under something else. It must be unique in your cohort.
              </p>
              <form
                className="grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  alias.mutate(aliasDraft ?? me.alias ?? "");
                }}
              >
                <input
                  type="text"
                  inputMode="text"
                  maxLength={24}
                  aria-label="Display name"
                  placeholder="e.g. Faithful7"
                  value={aliasDraft ?? me.alias ?? ""}
                  onChange={(event) => setAliasDraft(event.target.value)}
                  disabled={alias.isPending}
                  className={styles.input}
                />
                <div className={styles.actions}>
                  <button type="submit" disabled={alias.isPending} className={styles.btn}>
                    Save
                  </button>
                  {me.alias ? (
                    <button
                      type="button"
                      disabled={alias.isPending}
                      onClick={() => {
                        setAliasDraft("");
                        alias.mutate(null);
                      }}
                      className={styles.btn}
                      data-quiet=""
                    >
                      Use my real name
                    </button>
                  ) : null}
                </div>
              </form>
              {alias.isError ? (
                <p role="alert" className={styles.error}>
                  {alias.error.message}
                </p>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
