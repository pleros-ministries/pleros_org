"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckIcon } from "lucide-react";

import { logPlanReadingAction, saveBiblePlanAction, saveTeachingReportAction } from "@/app/(site)/dashboard/community/_actions/report-popup-actions";
import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import { BIBLE_DAY_MAX, BIBLE_PLAN_CHOICES, BIBLE_PLAN_MAX, TEACHING_NOTE_MAX, TEACHING_SOURCES, readingEnd, readingLabel, type BiblePosition, type TeachingSource } from "@/lib/community/report-popups";
import type { BibleDay, TeachingReport } from "@/lib/db/queries/report-popups";

import { BibleReadingInline, PrayerWatchInline } from "./devotion-inline";
import { ReportSheet, Segmented, Stepper, sheetStyles as styles } from "./report-sheet";

const dayMonth = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const longDate = (dateKey: string) => dayMonth.format(new Date(`${dateKey}T00:00:00Z`));
const chapters = (n: number) => `${n} ${n === 1 ? "chapter" : "chapters"}`;

/** The report page's optimistic save: shows the patch now and puts it back if the save fails. */
export type OptimisticSave = (patch: { prayer?: string[]; bible?: string; teaching?: string }, action: () => Promise<{ ok: boolean; error?: string }>) => void;

/** Runs a pop-up save, refreshes the page and closes the sheet; keeps the entries on failure. */
function useSheetSave() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, done: () => void) => {
    setError(null);
    start(async () => {
      try {
        const result = await action();
        if (!result.ok) { setError(result.error); return; }
        router.refresh(); done();
      } catch { setError("That could not be saved. Your entries are still here. Try again."); }
    });
  };
  return { pending, error, save };
}

/** Choose (or change) a chapter-a-day plan (Pastor: two, three or five a day, or another number). */
export function BiblePlanSheet({ dateKey, plan, onClose, onSaved }: {
  dateKey: string; plan: BibleDay["plan"]; onClose: () => void; onSaved?: () => void;
}) {
  const { pending, error, save } = useSheetSave();
  const preset = (n: number | undefined) => n !== undefined && (BIBLE_PLAN_CHOICES as readonly number[]).includes(n);
  const [perDay, setPerDay] = useState(plan?.chaptersPerDay ?? 3);
  const [other, setOther] = useState(plan ? !preset(plan.chaptersPerDay) : false);
  const [book, setBook] = useState(plan?.startBook ?? "Matthew");
  const [chapter, setChapter] = useState(String(plan?.startChapter ?? 1));
  const found = getBibleBook(book);
  const start = Number(chapter);
  const validStart = found && Number.isInteger(start) && start >= 1 && start <= found.chapters;
  const daysLeft = found && validStart ? Math.ceil((found.chapters - start + 1) / perDay) : null;

  return <ReportSheet title="Your Bible reading plan" subtitle="Pick how many chapters a day. You can change it any time." onClose={onClose}
    footer={close => <button type="button" className={styles.primary} disabled={pending || !validStart} onClick={() => save(() => saveBiblePlanAction({ dateKey, chaptersPerDay: perDay, book, chapter: start }), () => { close(); onSaved?.(); })}>{pending ? "Saving…" : plan ? "Save my plan" : "Start my plan"}</button>}>
    {() => <>
      <div className={styles.plans} role="group" aria-label="Chapters a day">
        {BIBLE_PLAN_CHOICES.map(n => <button key={n} type="button" className={styles.plan} aria-pressed={!other && perDay === n} onClick={() => { setOther(false); setPerDay(n); }}><b>{n}</b><span>chapters a day</span></button>)}
        <button type="button" className={styles.plan} aria-pressed={other} onClick={() => { setOther(true); if (preset(perDay)) setPerDay(4); }}><b>…</b><span>Another number</span></button>
      </div>
      {other ? <Stepper label="Chapters a day" value={perDay} min={1} max={BIBLE_PLAN_MAX} onChange={setPerDay} unit={["chapter a day", "chapters a day"]} /> : null}
      <div className={styles.field}>
        <span className={styles.label} id="plan-start-label">{plan ? "Where are you now?" : "Where are you starting?"}</span>
        <div className={styles.row}>
          <select className={styles.select} style={{ flex: 2 }} aria-labelledby="plan-start-label" value={book} onChange={event => { setBook(event.target.value); setChapter("1"); }}>
            {BIBLE_BOOKS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
          </select>
          <input className={styles.input} style={{ flex: 1 }} aria-label="Chapter" inputMode="numeric" value={chapter} aria-invalid={!validStart || undefined} onChange={event => setChapter(event.target.value.replace(/\D/g, ""))} />
        </div>
        <p className={styles.hint}>{validStart && daysLeft ? `At ${perDay} a day you finish ${book} in ${daysLeft === 1 ? "1 day" : `${daysLeft} days`}.` : `Choose a chapter from 1 to ${found?.chapters ?? 150}.`}</p>
      </div>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;
}

/** The day's reading on the plan: one tap for the planned chapters, or another number from the same place. */
export function BibleTodaySheet({ dateKey, day, onClose, onChangePlan, onOptimistic }: {
  dateKey: string; day: BibleDay & { reading: NonNullable<BibleDay["reading"]>; plan: NonNullable<BibleDay["plan"]> };
  onClose: () => void; onChangePlan: () => void;
  /** Optimistic (user request, 20 October): the row shows the reading at once and the sheet closes. */
  onOptimistic?: OptimisticSave;
}) {
  const { pending, error, save } = useSheetSave();
  const { plan, reading, logged } = day;
  const [count, setCount] = useState(logged?.chapters ?? plan.chaptersPerDay);
  const start: BiblePosition = reading.start;
  const end = readingEnd(start, count);
  const label = readingLabel(start, end);
  const log = (n: number | undefined, close: () => void) => {
    if (!onOptimistic) { save(() => logPlanReadingAction({ dateKey, chapters: n }), close); return; }
    const amount = n ?? plan.chaptersPerDay;
    const to = readingEnd(start, amount);
    onOptimistic({ bible: `${chapters(amount)}, now at ${to.book} ${to.chapter}` }, () => logPlanReadingAction({ dateKey, chapters: n }));
    close();
  };

  return <ReportSheet title="Bible reading" subtitle={longDate(dateKey)} onClose={onClose}
    footer={close => <>
      <button type="button" className={styles.quiet} onClick={() => { close(); onChangePlan(); }}>Change plan</button>
      {count !== plan.chaptersPerDay || logged ? <button type="button" className={`${styles.primary} ${styles.fit}`} disabled={pending} onClick={() => log(count, close)}>{pending ? "Saving…" : `Save ${chapters(count)}`}</button> : null}
    </>}>
    {close => <>
      <div className={styles.today}>
        <span>{logged ? "Logged for this day" : `Today on your plan · ${plan.chaptersPerDay} a day`}</span>
        <h3>{logged ? `${chapters(logged.chapters)}, now at ${logged.book} ${logged.chapter}` : reading.label}</h3>
        <p>Day {plan.day} · {chapters(plan.readSince)} read since you started</p>
      </div>
      {logged ? null : <button type="button" className={styles.primary} disabled={pending} onClick={() => log(undefined, close)}><CheckIcon className="size-4" aria-hidden="true" />I read {reading.label}</button>}
      <div className={styles.field}>
        <span className={styles.label}>{logged ? "Change the amount" : "Read a different amount?"} <em>Optional</em></span>
        <Stepper label="Chapters read" value={count} min={1} max={BIBLE_DAY_MAX} onChange={setCount} unit={["chapter", "chapters"]} detail={label} />
        <p className={styles.hint}>Your next reading starts after {end.book} {end.chapter}.</p>
      </div>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;
}

/** Before migration 0068 there are no plans: the free entry form, in a pop-up. */
export function BibleFreeSheet({ dateKey, initial, onClose }: { dateKey: string; initial: BibleDay["logged"]; onClose: () => void }) {
  return <ReportSheet title="Bible reading" subtitle={longDate(dateKey)} onClose={onClose}>
    {close => <BibleReadingInline date={dateKey} initial={initial} disabled={false} onSaved={close} />}
  </ReportSheet>;
}

export function PrayerWatchSheet({ dateKey, attended, times, onClose, onChange }: { dateKey: string; attended: string[]; times?: string[]; onClose: () => void; onChange?: (sessions: string[], times: string[]) => void }) {
  return <ReportSheet title="Prayer Watch" subtitle={longDate(dateKey)} onClose={onClose}
    footer={close => <button type="button" className={styles.primary} onClick={close}>Done</button>}>
    {() => <PrayerWatchInline date={dateKey} attended={attended} times={times} disabled={false} onChange={onChange} />}
  </ReportSheet>;
}

/** Teaching (Pastor: a general Teaching report, SOGP, podcast or both, with optional extra details). */
export function TeachingSheet({ dateKey, sogp, podcast, report, available, onClose, onOptimistic }: {
  /** Optimistic (user request, 20 October): the row shows the teaching at once and the sheet closes. */
  onOptimistic?: OptimisticSave;
  dateKey: string;
  /** What SOGP and the podcast recorded by themselves that day, if anything. */
  sogp: string | null; podcast: string | null;
  report: TeachingReport | null; available: boolean; onClose: () => void;
}) {
  const { pending, error, save } = useSheetSave();
  const [source, setSource] = useState<TeachingSource>(report?.source ?? (sogp && podcast ? "both" : podcast ? "podcast" : "sogp"));
  const [note, setNote] = useState(report?.note ?? "");
  const lines = [
    source !== "podcast" ? { key: "sogp", title: "SOGP", detail: sogp } : null,
    source !== "sogp" ? { key: "podcast", title: "Podcast", detail: podcast } : null,
  ].filter(line => line !== null);

  return <ReportSheet title="Teaching" subtitle="What did you learn from today?" onClose={onClose}
    footer={available ? close => <button type="button" className={styles.primary} disabled={pending} onClick={() => {
      if (!onOptimistic) { save(() => saveTeachingReportAction({ dateKey, source, note }), close); return; }
      onOptimistic({ teaching: `${source === "both" ? "SOGP and podcast" : source === "sogp" ? "SOGP" : "Podcast"}${note.trim() ? " · note added" : ""}` }, () => saveTeachingReportAction({ dateKey, source, note }));
      close();
    }}>{pending ? "Saving…" : "Save teaching"}</button> : undefined}>
    {() => <>
      <Segmented label="Teaching from" options={TEACHING_SOURCES} value={source} onChange={setSource} />
      <div className={styles.box}>
        {lines.map(line => <div key={line.key} className={styles.line}>
          <span className={styles.tick} data-on={line.detail ? "" : undefined} aria-hidden="true">{line.detail ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
          <span className={styles.lineCopy}><span className={styles.lineTitle}>{line.title}</span><span className={styles.lineMeta}>{line.detail ? `${line.detail} · recorded as you ${line.key === "sogp" ? "learned" : "listened"}` : `Nothing recorded yet. It fills in as you ${line.key === "sogp" ? "learn" : "listen"}.`}</span></span>
        </div>)}
      </div>
      {available ? <label className={styles.field}>
        <span className={styles.label}>Anything to add? <em>Optional</em></span>
        <textarea className={styles.textarea} maxLength={TEACHING_NOTE_MAX} value={note} placeholder="A takeaway, a question, or a teaching you watched elsewhere" onChange={event => setNote(event.target.value)} />
      </label> : <p className={styles.hint}>SOGP and the podcast fill in as you learn and listen. You confirm them when you submit.</p>}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;
}
