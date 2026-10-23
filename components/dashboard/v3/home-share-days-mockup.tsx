"use client";

import { useState, type CSSProperties } from "react";
import { BookOpenIcon, CheckIcon, ChevronDownIcon, ClipboardCheckIcon, HeartHandshakeIcon, Share2Icon } from "lucide-react";

import { ReportSheet, sheetStyles as sheet } from "@/components/community/report/report-sheet";

import styles from "./dashboard.module.css";
import strip from "./sogp-day-strip.module.css";

/**
 * Mockup (sample data, nothing saved): You Home after the Pastor's 22 October
 * review. "Share what you learnt today" leaves Today for a card of its own,
 * about half the learning card, so it calls people to act. Every SOGP day can
 * be tapped to see what it held, so you can check you're really on day 11.
 */

type Day = { number: number; weekday: string; date: number; state: "done" | "missed" | "today" | "later"; review?: boolean; teaching: string | null; listened: boolean; assessed: boolean; prayed: boolean };
const TITLES = ["Gospel: The Word of Truth", "God’s Purpose: Why We Exist", "The New Creation", "Faith Stand", "Bibliology", "God and His Eternal Purpose"];
const DAYS: Day[] = Array.from({ length: 14 }, (_, index) => {
  const number = index + 1, review = number % 7 === 0;
  const state = number < 11 ? (number === 4 || number === 9 ? "missed" : "done") : number === 11 ? "today" : "later";
  return { number, weekday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index % 7]!, date: 12 + index, state, review,
    teaching: review ? null : TITLES[index % TITLES.length]!, listened: state === "done", assessed: state === "done" && number !== 8, prayed: state === "done" || number === 4 };
});

function Tick({ done }: { done: boolean }) {
  return <span className="grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: done ? "var(--color-community-green-ink)" : "#c9ced6", background: done ? "var(--color-community-green-ink)" : "transparent" }} aria-label={done ? "Done" : "Not yet"}>
    {done ? <CheckIcon className="size-3 text-white" strokeWidth={3} aria-hidden="true" /> : null}
  </span>;
}

export function HomeShareDaysMockup() {
  const [open, setOpen] = useState<Day | null>(null);
  const [all, setAll] = useState(false);
  const week = all ? DAYS : DAYS.slice(7, 14);
  return <div className="grid gap-3.5 px-4 pt-4 pb-10">
    {/* The learning card stays as it is; shown here as a placeholder for scale. */}
    <div className="grid h-[200px] content-end rounded-[16px] bg-[#2056d6] p-4 text-[13px] text-white/90">My learning card (unchanged)</div>

    {/* Share, standing apart: about half the learning card, its own warm field. */}
    <section className="relative grid min-h-[104px] content-between gap-3 overflow-hidden rounded-[16px] p-4" style={{ background: "#f6ecd9", color: "#5a3d0c" } as CSSProperties} aria-label="Share what you learnt today">
      <span className="grid gap-1 pr-16">
        <span className="font-[family-name:var(--font-dashboard-heading)] text-[17px] leading-6 font-medium">Share what you learnt today</span>
        <span className="text-[12.5px] leading-[18px] opacity-85">Turn today’s teaching into a card for your status or your group</span>
      </span>
      <button type="button" className="inline-flex h-[36px] items-center gap-2 justify-self-start rounded-[10px] bg-white px-3.5 text-[13px] font-medium text-[#5a3d0c] shadow-[0_1px_2px_rgb(0_0_0/8%)]"><Share2Icon className="size-4" strokeWidth={2} aria-hidden="true" />Share</button>
      <span className="absolute -right-3 -bottom-3 grid size-24 place-items-center rounded-full bg-white/45" aria-hidden="true"><Share2Icon className="size-9 opacity-60" strokeWidth={1.6} /></span>
    </section>

    {/* Today keeps its three ticks; every day in the strip can now be tapped. */}
    <section className={styles.homeSection} style={{ marginTop: 18 }}>
      <div className="mb-2.5 flex items-baseline justify-between"><h2 className="m-0 text-[15px] leading-[22px] font-medium">Today</h2><span className="text-[12.5px] text-(--color-text-muted)">1 of 3 done</span></div>
      <div className={styles.homePanel}>
        <div className={styles.homeTodayHead}><span className="text-[14px] font-medium">Day 11 of 28 · Thursday 22 October</span></div>
        <ol className={strip.strip} aria-label="Your SOGP days">
          {week.map(day => <li key={day.number}>
            <button type="button" onClick={() => setOpen(day)} className={`${strip.day} w-full border-0 bg-transparent`} data-state={day.state === "today" ? undefined : day.state} data-today={day.state === "today" || undefined} data-review={day.review || undefined}
              aria-label={`Day ${day.number}, ${day.weekday} ${day.date} October: see what it held`}>
              <b>{day.number}</b><span>{day.weekday} {day.date}</span>
            </button>
          </li>)}
        </ol>
        <button type="button" className={strip.more} aria-expanded={all} onClick={() => setAll(value => !value)}>{all ? "Show this week only" : "See all 28 days"}<ChevronDownIcon className="size-4" strokeWidth={2.2} aria-hidden="true" /></button>
        <p className="m-0 pb-3 text-[12px] leading-4 text-(--color-text-muted)">Tap any day to see what it held.</p>
      </div>
    </section>

    {open ? <ReportSheet title={`Day ${open.number} · ${open.weekday} ${open.date} October`} subtitle={open.review ? "Group review day" : open.state === "later" ? "Opens on the day" : open.state === "today" ? "Today" : open.state === "missed" ? "Something still to catch up" : "All done"} onClose={() => setOpen(null)}
      footer={close => <>
        <button type="button" className={sheet.quiet} onClick={close}>Close</button>
        {open.teaching && open.state !== "later" ? <button type="button" className={`${sheet.primary} ${sheet.fit}`} onClick={close}>Open the teaching</button> : null}
      </>}>
      {() => open.review ? <p className={sheet.muted}>Your group’s weekly review. Join it live or watch the replay.</p>
        : open.state === "later" ? <p className={sheet.muted}>{open.teaching} opens on {open.weekday} {open.date} October.</p>
        : <div className="grid gap-3">
          <div className="flex items-center gap-3"><BookOpenIcon className="size-4 shrink-0 text-(--color-text-muted)" aria-hidden="true" /><span className="min-w-0 flex-1 text-[13.5px]"><b className="block font-medium">Teaching</b>{open.teaching}</span><Tick done={open.listened} /></div>
          <div className="flex items-center gap-3"><HeartHandshakeIcon className="size-4 shrink-0 text-(--color-text-muted)" aria-hidden="true" /><span className="min-w-0 flex-1 text-[13.5px]"><b className="block font-medium">Prayer Watch</b>Morning, 5:30 am</span><Tick done={open.prayed} /></div>
          <div className="flex items-center gap-3"><ClipboardCheckIcon className="size-4 shrink-0 text-(--color-text-muted)" aria-hidden="true" /><span className="min-w-0 flex-1 text-[13.5px]"><b className="block font-medium">Assessment</b>Quiz and written response</span><Tick done={open.assessed} /></div>
        </div>}
    </ReportSheet> : null}
  </div>;
}
