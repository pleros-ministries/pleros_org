"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheckIcon, ChevronRightIcon } from "lucide-react";

import type { LearningHistory } from "@/lib/db/queries/own-learning-history";

import styles from "./learning-hub.module.css";

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

  return <div className={styles.page} style={{ gridTemplateColumns: "minmax(0, 1fr)", maxWidth: 640 }}>
    <div className={styles.column}>
      <h1 style={{ margin: 0 }}>Your history</h1>
      <div className={styles.panel} style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", padding: "11px 0" }}>
        {([[history.tracksDone, "Tracks done"], [history.quizAverage !== null ? `${history.quizAverage}%` : "–", "Quiz average"], [history.responses, "Responses"]] as const).map(([value, label], index) => <div key={label} style={{ display: "grid", gap: 1, padding: "0 12px", borderLeft: index ? "1px solid var(--color-line, #e7e9ec)" : 0 }}>
          <strong style={{ fontFamily: "var(--font-dashboard-heading)", fontSize: 19, lineHeight: "24px", fontWeight: 500 }}>{value}</strong>
          <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>{label}</span>
        </div>)}
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Show">
        {([["all", "All"], ["quizzes", "Quizzes"], ["written", "Written"], ["reviews", "Reviews"]] as const).map(([key, label]) => <button key={key} type="button" role="radio" aria-checked={filter === key} onClick={() => setFilter(key)} className={styles.btn} data-quiet={filter === key ? undefined : ""}>{label}</button>)}
      </div>
      {weeks.length ? weeks.map(week => <section key={week.week} className={styles.column} style={{ gap: 8 }}>
        <div className={styles.sectionTitle} style={{ margin: "8px 2px 0" }}><h2 style={{ fontSize: 13, fontFamily: "inherit", color: "var(--color-text-muted)" }}>Week {week.week}</h2><span>{week.items.filter(item => item.kind === "track" && item.completed).length} done</span></div>
        <div className={styles.panel}><ul className={styles.list}>
          {week.items.map(item => <li key={item.key}>{item.kind === "track"
            ? <Link href={item.href} className={styles.row}>
              <span className={styles.num} data-current={item.completed || undefined}>{item.number}</span>
              <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{[item.at ? day.format(new Date(item.at)) : null, item.lessonDone ? "lesson" : null, item.quizScore !== null ? "quiz" : null, item.written ? WRITTEN[item.written] : null].filter(Boolean).join(" · ") || "Started"}</span></span>
              {item.quizScore !== null ? <span className={styles.points} style={{ padding: "2px 7px", borderRadius: 99, background: item.quizScore >= 70 ? "#e4ebfd" : "#f7e4cd", color: item.quizScore >= 70 ? "#2331ae" : "#92400e", fontWeight: 600 }}>{item.quizScore}%</span> : null}
              <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} />
            </Link>
            : <div className={styles.row}>
              <span className={styles.num} style={{ background: "#fde3cf", color: "#7a3a10" }}><CalendarCheckIcon className="size-3.5" strokeWidth={2.2} /></span>
              <span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{day.format(new Date(item.at))} · {item.status === "attended" ? "attended" : "missed"}</span></span>
            </div>}</li>)}
        </ul></div>
      </section>) : <p className={styles.notice}>{filter === "all" ? "Nothing yet. Your tracks, quizzes and reviews will show here as you go." : "Nothing to show for this filter yet."}</p>}
    </div>
  </div>;
}
