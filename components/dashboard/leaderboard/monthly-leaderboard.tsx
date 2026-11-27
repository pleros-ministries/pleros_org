"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { TrophyIcon } from "lucide-react";

import group from "@/components/community/discipleship/discipleship-group.module.css";
import hub from "@/components/sogp/learning/learning-hub.module.css";
import {
  LATE_RECORD_DAYS,
  MONTHLY_POINTS,
  PRAYER_SESSIONS_PER_DAY,
  placeViewer,
  type MonthlyEntry,
  type MonthlyLeaderboardData,
} from "@/lib/leaderboard/monthly";

import styles from "./leaderboard.module.css";

export type LeaderboardSaveResult = { ok: true } | { ok: false; error: string };

const SAVE_ERROR = "Couldn’t save that. Check your connection and try again.";
const NAME_RULE = /^[\p{L}\p{N} _-]+$/u;
const NAME_HELP = "Use 2 to 24 letters or numbers. Spaces, - and _ are fine too.";

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

const RULES = [
  { title: "Each day you learn", meta: "However many teachings you finish that day", points: MONTHLY_POINTS.learningDay },
  { title: "Each Prayer Watch", meta: `Up to ${PRAYER_SESSIONS_PER_DAY} a day`, points: MONTHLY_POINTS.prayerSession },
  { title: "Each day you read your Bible", meta: null, points: MONTHLY_POINTS.bibleDay },
  { title: "Each person who joins", meta: "Your groups, the groups under you, or through your invite link", points: MONTHLY_POINTS.invitation },
];

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function BoardRow({ row, closing, gap }: { row: MonthlyEntry; closing?: boolean; gap?: boolean }) {
  return <li
    aria-current={row.isMe ? "true" : undefined}
    className={`${hub.boardRow} ${row.isMe ? styles.meRow : ""} ${gap ? hub.boardGap : ""}`}
    data-me={row.isMe || undefined}
    data-closing={closing || undefined}
  >
    <span className={hub.boardRank} data-rank={row.rank <= 3 ? row.rank : undefined}>{row.rank}</span>
    <span className={hub.boardName}>{row.isMe ? `${row.name} · You` : row.name}</span>
    <span className={hub.boardPts}>{row.points}<small> pts</small></span>
  </li>;
}

/**
 * This month's board for everyone (Pastor, 25 November 2026). Hiding and the
 * leaderboard name show at once and roll back with a message if they fail.
 */
export function MonthlyLeaderboard({ data, saveHidden, saveAlias }: {
  data: MonthlyLeaderboardData;
  /** Absent on previews: changes show but nothing is saved. */
  saveHidden?: (hidden: boolean) => Promise<LeaderboardSaveResult>;
  saveAlias?: (alias: string | null) => Promise<LeaderboardSaveResult>;
}) {
  const { month, me } = data;
  const [hidden, setHidden] = useState(me.hidden);
  const [closing, setClosing] = useState(false);
  const [alias, setAlias] = useState(me.alias);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const name = alias ?? me.firstName;
  const board = placeViewer(data, { hidden, name });
  const shown = !hidden && !closing;

  function applyHidden(next: boolean) {
    if (timer.current) window.clearTimeout(timer.current);
    // Your row leaves the way it came in before the board closes up.
    if (next && !hidden && me.points > 0 && !reducedMotion()) {
      setClosing(true);
      timer.current = window.setTimeout(() => { setClosing(false); setHidden(true); }, 180);
      return;
    }
    setClosing(false);
    setHidden(next);
  }

  function toggle(show: boolean) {
    setError(null);
    applyHidden(!show);
    if (!saveHidden) return;
    startTransition(async () => {
      const result = await saveHidden(!show).catch((): LeaderboardSaveResult => ({ ok: false, error: SAVE_ERROR }));
      if (!result.ok) {
        applyHidden(show);
        setError(result.error);
      }
    });
  }

  function saveName(next: string | null) {
    setNameError(null);
    if (next !== null && (next.length < 2 || next.length > 24 || !NAME_RULE.test(next))) {
      setNameError(NAME_HELP);
      return;
    }
    const previous = alias;
    setAlias(next);
    setDraft(null);
    if (!saveAlias) return;
    startTransition(async () => {
      const result = await saveAlias(next).catch((): LeaderboardSaveResult => ({ ok: false, error: SAVE_ERROR }));
      if (!result.ok) {
        setAlias(previous);
        setDraft(next ?? "");
        setNameError(result.error);
      }
    });
  }

  function submitName(event: FormEvent) {
    event.preventDefault();
    saveName((draft ?? alias ?? "").trim() || null);
  }

  const typed = (draft ?? alias ?? "").trim() || null;
  const boardMeta = board.myRank && shown
    ? `You’re #${board.myRank} of ${board.total}`
    : board.myRank ? "You’re hidden. Only you see your rank"
    : board.total ? `${plural(board.total, "person", "people")} so far`
    : "No one yet";
  const parts = [
    { title: "Learning", meta: me.counts.learningDays ? `${me.counts.learningDays} of ${plural(month.daysSoFar, "day")}` : "None yet", points: me.breakdown.learning },
    { title: "Prayer Watch", meta: me.counts.prayerSessions ? plural(me.counts.prayerSessions, "time") : "None yet", points: me.breakdown.prayer },
    { title: "Bible reading", meta: me.counts.bibleDays ? plural(me.counts.bibleDays, "day") : "None yet", points: me.breakdown.bible },
    { title: "Invitations", meta: me.counts.invitations ? `${plural(me.counts.invitations, "person", "people")} joined` : "No one yet", points: me.breakdown.invitations },
  ];

  return <section className={styles.page}>
    <header>
      <h1>Leaderboard</h1>
      <p className={group.sub}>{month.label}{board.total ? ` · ${plural(board.total, "person", "people")} on the board` : ""}</p>
    </header>

    <div className={group.strip}>
      <div><span>Your rank</span><strong>{board.myRank ? `#${board.myRank}` : "Not yet"}</strong></div>
      <div><span>Points</span><strong>{me.points}</strong></div>
      <div><span>{month.daysLeft === 1 ? "Last day" : "Days left"}</span><strong>{month.daysLeft}</strong></div>
    </div>

    <section className={hub.board} aria-labelledby="monthly-ranking">
      <header className={hub.boardHead}>
        <span className={hub.boardIcon} aria-hidden="true"><TrophyIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={group.rowCopy}>
          <h2 id="monthly-ranking">{month.name}</h2>
          <span className={group.rowMeta}>{boardMeta}</span>
        </span>
      </header>
      {board.rows.length ? <ol className={hub.boardList}>
        {board.rows.map((row, index) => <BoardRow key={row.isMe ? "me" : `${index}-${row.name}`} row={row} closing={row.isMe && closing} />)}
        {board.outside ? <BoardRow key="me" row={board.outside} closing={closing} gap /> : null}
      </ol> : <p className={group.empty}>
        {month.daysSoFar <= 1 ? "A new month has begun. Your first activity puts you on the board." : "No one is on the board yet this month. Your first activity puts you on it."}
      </p>}
    </section>

    <div className={group.sectionTitle}><h2>Your points</h2></div>
    <div className={group.panel}>
      <ul className={group.list}>{parts.map(part => <li key={part.title} className={group.row}>
        <span className={group.rowCopy}><span className={group.rowTitle}>{part.title}</span><span className={group.rowMeta}>{part.meta}</span></span>
        <span className={styles.value} data-quiet={part.points ? undefined : ""}>{part.points}</span>
      </li>)}</ul>
    </div>

    <div className={group.sectionTitle}><h2>How points work</h2></div>
    <div className={group.panel}>
      <ul className={group.list}>{RULES.map(rule => <li key={rule.title} className={group.row}>
        <span className={group.rowCopy}><span className={group.rowTitle}>{rule.title}</span>{rule.meta ? <span className={`${group.rowMeta} ${styles.wrap}`}>{rule.meta}</span> : null}</span>
        <span className={styles.value}>+{rule.points}</span>
      </li>)}</ul>
    </div>
    <p className={group.note}>The board starts afresh on the 1st of each month. A day can be recorded up to {LATE_RECORD_DAYS} days late.</p>

    <div className={group.sectionTitle}><h2>How you appear</h2></div>
    <div className={group.panel}>
      <label className={styles.switchRow}>
        <span className={group.rowCopy}>
          <span className={group.rowTitle}>Show me on the leaderboard</span>
          <span className={group.rowMeta}>{shown ? `Others see ${name} and your points` : "Only you see your rank"}</span>
        </span>
        <span className={styles.switch}>
          <input type="checkbox" role="switch" checked={shown} onChange={event => toggle(event.currentTarget.checked)} />
          <span className={styles.track} aria-hidden="true" />
          <span className={styles.thumb} aria-hidden="true" />
        </span>
      </label>
      {error ? <p role="alert" className={styles.error} style={{ padding: "0 14px 12px" }}>{error}</p> : null}
      <form className={styles.nameForm} onSubmit={submitName}>
        <label htmlFor="leaderboard-name" className={styles.label}>Leaderboard name</label>
        <div className={styles.field}>
          <input
            id="leaderboard-name"
            className={styles.input}
            maxLength={24}
            autoComplete="off"
            placeholder={me.firstName}
            value={draft ?? alias ?? ""}
            onChange={event => { setDraft(event.target.value); setNameError(null); }}
            aria-invalid={nameError ? true : undefined}
            aria-describedby="leaderboard-name-help"
          />
          <button type="submit" className={group.btn} data-primary="" disabled={typed === alias}>Save</button>
        </div>
        <p id="leaderboard-name-help" className={styles.helper}>Shown instead of your first name.</p>
        {alias ? <button type="button" className={group.quiet} onClick={() => saveName(null)}>Use my first name</button> : null}
        {nameError ? <p role="alert" className={styles.error}>{nameError}</p> : null}
      </form>
    </div>
  </section>;
}
