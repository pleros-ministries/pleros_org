"use client";

import Link from "next/link";
import { AwardIcon, CalendarCheckIcon, ChevronLeftIcon, ChevronRightIcon, HistoryIcon, InfoIcon, LockIcon, MessageCircleQuestionIcon, RepeatIcon, SparklesIcon } from "lucide-react";
import type { ReactNode } from "react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

/**
 * Mockup (sample data, nothing saved) of the SOGP page the SOGP card on
 * Learning opens (Pastor, 21 October): Learning keeps only what you're
 * learning now, so the SOGP details live here. Certificate near the top,
 * naming only what's missing; the four levels; what comes after SOGP; and
 * the Your learning tools as a quiet list at the foot.
 */

const AMBER = "#a15c12";
const GREEN = "var(--color-community-green-ink)";

function Chip({ tone, children }: { tone: [string, string]; children: ReactNode }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{children}</span>;
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return <span className="inline-flex items-center gap-1.5 text-[12px] leading-4" style={{ color: ok ? GREEN : AMBER }}>
    <i className="size-1.5 rounded-full" style={{ background: ok ? GREEN : "#d98a1f" }} aria-hidden="true" />{label}
  </span>;
}

type Level = { level: number; title: string; done: number; state: "done" | "now" | "later"; opens?: string };
const LEVELS: Level[] = [
  { level: 1, title: "Gospel foundations and the Spirit", done: 6, state: "done" },
  { level: 2, title: "Doctrinal foundations", done: 3, state: "now" },
  { level: 3, title: "Redemption and lived faith", done: 0, state: "later", opens: "Opens Mon 26 Oct" },
  { level: 4, title: "Practical life and assignment", done: 0, state: "later", opens: "Opens Mon 2 Nov" },
];

export function SogpPageMockup({ ready }: { ready: boolean }) {
  return <div className={styles.page}>
    <nav aria-label="Breadcrumb" className="-mx-4 -mt-[18px] mb-1 flex h-10 items-center gap-1.5 border-b border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-4 text-[12.5px] text-(--color-community-muted)">
      <Link href="#" aria-label="Back" className="-ml-1 grid size-7 place-items-center"><ChevronLeftIcon className="size-4" strokeWidth={2} /></Link>
      <span>Learning</span><ChevronRightIcon className="size-3" strokeWidth={2} /><span className="font-medium text-(--color-community-ink)">School of God’s Purpose</span>
    </nav>

    <div>
      <h1>School of God’s Purpose</h1>
      <p className={styles.sub}>SOGP October 2026 · Day 9 of 28 · A lesson a day</p>
    </div>

    {/* Certificate near the top (Pastor: "worth being here… more visible"); only what's missing is named. */}
    <div className={styles.panel}>
      <div className={styles.row} style={{ alignItems: "flex-start" }}>
        <Chip tone={["#f6e4ac", "#5a4508"]}><AwardIcon className="size-[18px]" strokeWidth={2} /></Chip>
        <span className={`${styles.rowCopy} gap-1`}>
          <span className={styles.rowTitle}>Your certificate</span>
          {ready ? <Dot ok label="Ready to download" /> : <>
            <Dot ok={false} label="Prayer Watch 64%, needs 80%" />
            <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>Teachings and group reviews are on track</span>
          </>}
          <Link href="#" className={`${styles.btn} ${styles.mini} mt-1.5 justify-self-start`} data-primary={ready ? "" : undefined}>{ready ? "Download" : "See what’s left"}</Link>
        </span>
      </div>
    </div>

    <div className={styles.sectionTitle}><h2>Your four levels</h2><Link href="#" className={styles.quiet}>Your 28 days</Link></div>
    <div className={styles.panel}><ul className={styles.list}>
      {LEVELS.map(level => <li key={level.level}><Link href="#" className={styles.row}>
        <span className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-medium"
          style={level.state === "now" ? { background: "#2331ae", color: "white" } : level.state === "done" ? { background: "#e4ebfd", color: "#2331ae" } : { background: "#f1f2f5", color: "#8b919a" }}>{level.level}</span>
        <span className={`${styles.rowCopy} gap-0.5`}>
          <span className={styles.rowTitle} style={{ whiteSpace: "normal" }}>{level.title}</span>
          {level.state === "done" ? <Dot ok label="6 of 6 teachings · done" />
            : level.state === "now" ? <span className={styles.rowMeta} style={{ color: "var(--color-community-blue)" }}>{level.done} of 6 teachings · now</span>
            : <span className={`${styles.rowMeta} inline-flex items-center gap-1`}><LockIcon className="size-3" strokeWidth={2} aria-hidden="true" />{level.opens}</span>}
        </span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
    </ul></div>

    {/* The next phase (Pastor): after the first SOGP, choose the next set of teachings. */}
    <div className={styles.sectionTitle}><h2>After SOGP</h2></div>
    <div className={styles.panel}>
      <div className={styles.row}>
        <Chip tone={["#eceef2", "#6b7280"]}><SparklesIcon className="size-[18px]" strokeWidth={2} /></Chip>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>Choose your next teachings</span>
          <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>Opens when you finish your 28 days, so you always have something to learn and share</span>
        </span>
      </div>
    </div>

    {/* Your learning: quiet, at the foot, where people look for settings. */}
    <div className={styles.sectionTitle}><h2>Your learning</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      {([
        [RepeatIcon, "Change path or pace", "A lesson a day"],
        [HistoryIcon, "History", "9 teachings done"],
        [CalendarCheckIcon, "Group reviews", "Next: Sunday 25 October"],
        [MessageCircleQuestionIcon, "Ask about a teaching", "Your leader answers"],
        [InfoIcon, "How SOGP works", "Days, reviews and the certificate"],
      ] as const).map(([Icon, title, meta]) => <li key={title}><Link href="#" className={styles.row}>
        <Icon className="size-4 shrink-0 text-[var(--color-community-muted)]" strokeWidth={2} aria-hidden="true" />
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowMeta}>{meta}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
    </ul></div>
  </div>;
}
