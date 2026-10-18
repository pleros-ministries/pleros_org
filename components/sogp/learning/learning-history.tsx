"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheckIcon, ChevronRightIcon } from "lucide-react";

import type { LearningHistory } from "@/lib/db/queries/own-learning-history";

import styles from "../learning-tools.module.css";

type Filter = "all" | "quizzes" | "written" | "reviews";
const WRITTEN: Record<string, string> = { submitted: "response sent", approved: "response approved", needs_revision: "response needs revision" };
const day = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Lagos" });

/** Week by week: each track with its quiz score and response status, plus group reviews. */
export function LearningHistoryView({ history }: { history: LearningHistory }) {
  const [filter, setFilter] = useState<Filter>("all");
  const weeks = history.weeks.map(week => ({
    ...week,
    items: week.items.filter(item => filter === "all"
      || (filter === "reviews" ? item.kind === "review"
        : item.kind === "track" && (filter === "quizzes" ? item.quizScore !== null : item.written !== null))),
  })).filter(week => week.items.length);

  return <div className={styles.page}>
    <header className={styles.heading}>
      <h1>Your history</h1>
      <p className={styles.sub}>Tracks, quiz scores, responses and group reviews, week by week.</p>
    </header>
    <div className={styles.strip}>
      {([["Tracks done", history.tracksDone], ["Quiz average", history.quizAverage !== null ? `${history.quizAverage}%` : "–"], ["Responses", history.responses]] as const).map(([label, value]) => <div key={label}>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>)}
    </div>
    <div className={styles.actions} role="radiogroup" aria-label="Show">
      {([["all", "All"], ["quizzes", "Quizzes"], ["written", "Written"], ["reviews", "Reviews"]] as const).map(([key, label]) => <button key={key} type="button" role="radio" aria-checked={filter === key} onClick={() => setFilter(key)} className={styles.btn} data-size="sm" data-quiet={filter === key ? undefined : ""}>{label}</button>)}
    </div>
    {weeks.length ? weeks.map(week => <section key={week.week} className={styles.column} style={{ gap: 12 }}>
      <div className={styles.sectionTitle}><h2>Week {week.week}</h2><span>{week.items.filter(item => item.kind === "track" && item.completed).length} done</span></div>
      <div className={styles.panel}><ul className={styles.list}>
        {week.items.map(item => <li key={item.key}>{item.kind === "track"
          ? <Link href={item.href} className={styles.row}>
            <span className={styles.chip} data-size="sm" data-tone={item.completed ? undefined : "neutral"} style={item.completed ? { background: "var(--color-community-blue, #2056d6)", color: "white" } : undefined}>{item.number}</span>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{[item.at ? day.format(new Date(item.at)) : null, item.lessonDone ? "lesson" : null, item.quizScore !== null ? "quiz" : null, item.written ? WRITTEN[item.written] : null].filter(Boolean).join(" · ") || "Started"}</span></span>
            {item.quizScore !== null ? <span className={styles.pill} data-tone={item.quizScore >= 70 ? "done" : "todo"}>{item.quizScore}%</span> : null}
            <ChevronRightIcon className={`size-4 ${styles.chev}`} strokeWidth={2} />
          </Link>
          : <div className={styles.row}>
            <span className={styles.chip} data-size="sm" data-tone="peach"><CalendarCheckIcon className="size-3.5" strokeWidth={2.2} /></span>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{day.format(new Date(item.at))}</span></span>
            <span className={styles.pill} data-tone={item.status === "attended" ? "done" : "todo"}>{item.status === "attended" ? "Attended" : "Missed"}</span>
          </div>}</li>)}
      </ul></div>
    </section>) : <p className={styles.notice}>{filter === "all" ? "Nothing yet. Your tracks, quizzes and reviews will show here as you go." : "Nothing to show for this filter yet."}</p>}
  </div>;
}
