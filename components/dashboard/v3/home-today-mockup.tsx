"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { BookOpenCheckIcon, ChevronDownIcon, ClipboardCheckIcon, GiftIcon, HeadphonesIcon, PlayIcon, Share2Icon } from "lucide-react";

import learningStyles from "@/components/sogp/learning/learning-hub.module.css";

import styles from "./dashboard.module.css";
import { DashboardIcon } from "./primitives";
import strip from "./sogp-day-strip.module.css";

/**
 * Mockup (sample data, nothing saved) of You Home after the Pastor's 21
 * October review. Today's calendar is your SOGP days, not a Mon–Sun week:
 * the big number is the SOGP day, with the weekday and date under it; one
 * week shows and all 28 open below. Today is three ticks, Teaching, Prayer
 * Watch and Assessment (marked done once you've done it), then Share what
 * you learnt; the daily review leaves Today. Your progress shows the same
 * three. The Welcome Pack row moves from under the learning card.
 */

type DayState = "done" | "missed" | "today" | "later";
type SogpDay = { n: number; weekday: string; date: number; state: DayState; review: boolean };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Day 1 is Monday 12 October; today is day 10, Wednesday 21 October.
const DAYS: SogpDay[] = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1, date = new Date(Date.UTC(2026, 9, 12 + i));
  const state: DayState = n === 10 ? "today" : n < 10 ? (n === 4 ? "missed" : "done") : "later";
  return { n, weekday: WEEKDAYS[i % 7]!, date: date.getUTCDate(), state, review: n % 7 === 0 };
});
const TODAY = DAYS.find(day => day.state === "today")!;

function Week({ days, label }: { days: SogpDay[]; label?: string }) {
  return <>
    {label ? <p className={strip.weekLabel}>{label}</p> : null}
    <ol className={strip.strip} aria-label={label ?? "This week of SOGP"}>
      {days.map(day => <li key={day.n} className={strip.day} data-state={day.state === "today" ? undefined : day.state} data-today={day.state === "today" || undefined} data-review={day.review || undefined}
        aria-label={`Day ${day.n}, ${day.weekday} ${day.date} October${day.review ? ", group review" : ""}${day.state === "missed" ? ", to catch up" : day.state === "done" ? ", done" : ""}`}>
        <b>{day.n}</b>
        <span>{day.weekday} {day.date}</span>
      </li>)}
    </ol>
  </>;
}

function Tick({ done, onToggle, label }: { done: boolean; onToggle?: () => void; label: string }) {
  return <button type="button" className={styles.homeTick} data-complete={done} aria-pressed={done} disabled={!onToggle} onClick={onToggle} aria-label={label}>
    <span>{done ? <DashboardIcon name="check" size={16} /> : null}</span>
  </button>;
}

export function HomeTodayMockup({ podcast = false }: { podcast?: boolean }) {
  const [open, setOpen] = useState(false);
  const [teaching, setTeaching] = useState(false);
  const [prayer, setPrayer] = useState(true);
  const assessment = false; // Marked done by the quiz and written response, never by hand.
  const items = podcast ? [teaching, prayer] : [teaching, prayer, assessment];
  const weekStart = Math.floor((TODAY.n - 1) / 7) * 7;

  return <div className={`${styles.content} ${styles.homeContent}`}>
    <div className={styles.homeGreeting}>
      <h1 className={styles.greeting} data-dashboard-greeting>Good afternoon, Ada</h1>
      <p className={styles.metadata}>SOGP October 2026 · Week 2 of 4</p>
    </div>
    <div className={styles.homeMain}>
      <section className={learningStyles.card} aria-label="Resume learning" style={{ "--hub-art": `url("/assets/dashboard/learning-card/my-learning-level-2.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/my-learning-level-2-wide.webp")`, "--hub-field": "#24704d", "--hub-ink": "#1d5e40" } as CSSProperties}>
        <div className={learningStyles.cardTop}><span>Level 2 · Foundations</span><span className={learningStyles.pace}>1 hr/day · Traditional</span></div>
        <div><h2>Biblical Origin and Ontology</h2><span className={learningStyles.cardMeta}>Track 10 of 24 · 9 done</span></div>
        <Link href="#" className={learningStyles.resume}>Resume track 10 <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></Link>
      </section>

      <section className={styles.homeSection} aria-labelledby="mock-today-heading">
        <div className={styles.homeSectionHeader}><h2 id="mock-today-heading">Today</h2><span className={styles.metadata}>{items.filter(Boolean).length} of {items.length} done</span></div>
        <div className={styles.homePanel}>
          <div className={styles.homeTodayHead}>
            <span className={styles.rowTitle}>Day {TODAY.n} of 28 · Wednesday 21 October</span>
          </div>
          {open ? null : <Week days={DAYS.slice(weekStart, weekStart + 7)} />}
          {open ? <div className={strip.weeks}>
            {[0, 1, 2, 3].map(week => <Week key={week} label={`Week ${week + 1}`} days={DAYS.slice(week * 7, week * 7 + 7)} />)}
          </div> : null}
          <button type="button" className={strip.more} aria-expanded={open} onClick={() => setOpen(value => !value)}>
            {open ? "Show this week only" : "See all 28 days"}<ChevronDownIcon className="size-4" strokeWidth={2.2} aria-hidden="true" />
          </button>

          <div className={strip.divider} />

          <div className={styles.homeTaskRow}>
            <span className={styles.homeReportIcon} data-tone="blue">{podcast ? <HeadphonesIcon className="size-4" strokeWidth={2} /> : <BookOpenCheckIcon className="size-4" strokeWidth={2} />}</span>
            <span className={styles.rowCopy}>
              <span className={styles.rowTitle}>Teaching</span>
              <span className={styles.metadata}>{podcast ? "Today’s episodes" : "Biblical Origin and Ontology"} · <Link href="#" className={styles.homeInlineLink}>Listen</Link></span>
            </span>
            <Tick done={teaching} onToggle={() => setTeaching(value => !value)} label={teaching ? "Teaching listened. Mark as not done" : "Mark that you listened to the teaching"} />
          </div>
          <div className={styles.homeTaskRow}>
            <span className={styles.homeReportIcon} data-tone="amber"><DashboardIcon name="clock" /></span>
            <span className={styles.rowCopy}>
              <span className={styles.rowTitle}>5:30 am Prayer Watch</span>
              <span className={styles.metadata}>Live or replay · <a href="#" className={styles.homeInlineLink}>Pleros Live ↗</a></span>
            </span>
            <Tick done={prayer} onToggle={() => setPrayer(value => !value)} label={prayer ? "Prayer Watch done. Mark as not done" : "Mark Prayer Watch done"} />
          </div>
          {podcast ? null : <div className={styles.homeTaskRow}>
            <span className={styles.homeReportIcon} data-tone="lilac"><ClipboardCheckIcon className="size-4" strokeWidth={2} /></span>
            <span className={styles.rowCopy}>
              <span className={styles.rowTitle}>Assessment</span>
              <span className={styles.metadata}>Quiz and written response · <Link href="#" className={styles.homeInlineLink}>Do it</Link></span>
            </span>
            <Tick done={assessment} label="Assessment is marked done when you finish the quiz and written response" />
          </div>}
          <div className={styles.homeTaskRow}>
            <span className={styles.homeReportIcon} style={{ background: "#f6ecd9", color: "#5a3d0c" }}><Share2Icon className="size-4" strokeWidth={2} /></span>
            <span className={styles.rowCopy}>
              <span className={styles.rowTitle}>Share what you learnt</span>
              <span className={styles.metadata}>Turn today into a card</span>
            </span>
            <button type="button" className={`inline-flex h-8 shrink-0 items-center rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3 text-[12.5px] font-medium`}>Share</button>
          </div>
        </div>
      </section>

      <section className={styles.homeSection} aria-labelledby="mock-progress-heading">
        <div className={styles.homeSectionHeader}><h2 id="mock-progress-heading">Your progress</h2><Link href="#" className={styles.textAction}>Learning</Link></div>
        {/* The same three as Today, built from what you tick each day: counts, not bars. */}
        <div className="grid grid-cols-3 rounded-[10px] border border-[var(--dashboard-panel-edge)] bg-white py-3">
          {([["Teaching", "9", "of 24 days"], ["Prayer Watch", "64%", "needs 80%"], podcast ? null : ["Assessment", "8", "of 9 done"]] as const).filter(Boolean).map((cell, index) => <div key={cell![0]} className="grid min-w-0 gap-0.5 px-3" style={{ borderLeft: index ? "1px solid var(--color-line)" : undefined }}>
            <span className="truncate text-[11.5px] leading-[15px] text-[var(--color-text-muted)]">{cell![0]}</span>
            <strong className="font-[family-name:var(--font-dashboard-heading)] text-[22px] leading-7 font-medium" style={{ color: cell![0] === "Prayer Watch" ? "#a15c12" : undefined }}>{cell![1]}</strong>
            <span className="text-[11.5px] leading-[15px] text-[var(--color-text-muted)]">{cell![2]}</span>
          </div>)}
        </div>
      </section>

      <section className={styles.homeSection}>
        <div className={styles.homeSectionHeader}><h2>Leaderboard</h2></div>
        <p className={styles.metadata}>Unchanged</p>
      </section>
    </div>
    <div className={styles.homeSide}>
      <section className={styles.homeSection}>
        <div className={styles.homeSectionHeader}><h2>Invite someone</h2></div>
        <p className={styles.metadata}>Unchanged</p>
      </section>
      {/* Moved from under the learning card (Pastor: "an absurdity there"): a quiet row until it's finished. */}
      <section className={styles.homeSection} aria-labelledby="mock-finish-heading">
        <div className={styles.homeSectionHeader}><h2 id="mock-finish-heading">Finish setting up</h2></div>
        <Link href="#" className={`${styles.homePanel} flex items-center gap-3 py-3 no-underline`}>
          <span className={styles.homeReportIcon} style={{ background: "#d1e7fc", color: "#123f6e" }}><GiftIcon className="size-4" strokeWidth={2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>Your Welcome Pack</span><span className={styles.metadata}>Reminders not set yet</span></span>
          <DashboardIcon name="right" />
        </Link>
      </section>
      <section className={styles.homeSection}>
        <div className={styles.homeSectionHeader}><h2>Grow together · My reports</h2></div>
        <p className={styles.metadata}>Unchanged (Share what you learnt moved up into Today)</p>
      </section>
    </div>
  </div>;
}
