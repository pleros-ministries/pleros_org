"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckIcon } from "lucide-react";

import { listReportPodcastEpisodesAction, logPlanReadingAction, saveBiblePlanAction, saveTeachingReportAction } from "@/app/(site)/dashboard/community/_actions/report-popup-actions";
import type { ReportPodcastEpisode } from "@/lib/db/queries/podcast-progress";
import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import { BIBLE_DAY_MAX, BIBLE_PLAN_CHOICES, BIBLE_PLAN_MAX, TEACHING_NOTE_MAX, TEACHING_OTHER_MAX, readingEnd, readingLabel, teachingLabel, teachingParts, teachingSource, type BiblePosition, type TeachingParts } from "@/lib/community/report-popups";
import type { BibleDay, TeachingReport } from "@/lib/db/queries/report-popups";

import { BibleReadingInline, PrayerWatchInline } from "./devotion-inline";
import { ReportSheet, Stepper, sheetStyles as styles } from "./report-sheet";

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
const PAGE = 8;
const dayLabel = (dateKey: string) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${dateKey}T00:00:00Z`));

/**
 * Pick the day's podcast episodes (Pastor, 20 October): every episode in
 * release order, opening just before the last one listened, with a search.
 * Episodes listened on another day stay on that day.
 */
function PodcastPicker({ dateKey, picked, onChange, onLoaded }: { dateKey: string; picked: Set<string>; onChange: (next: Set<string>) => void; onLoaded: (initial: Set<string>) => void }) {
  const [state, setState] = useState<{ episodes: ReportPodcastEpisode[]; start: number } | "loading" | "error">("loading");
  const [range, setRange] = useState<[number, number] | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let live = true;
    listReportPodcastEpisodesAction().then(result => {
      if (!live) return;
      if (!result.ok) { setState("error"); return; }
      setState(result.value);
      setRange([result.value.start, result.value.start + PAGE]);
      onLoaded(new Set(result.value.episodes.filter(episode => episode.listenedOn === dateKey).map(episode => episode.guid)));
    }).catch(() => { if (live) setState("error"); });
    return () => { live = false; };
    // Loads once per open; the parent keeps the picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);
  if (state === "loading") return <p className={styles.hint}>Loading episodes…</p>;
  if (state === "error") return <p className={styles.hint}>Episodes couldn’t load. Your podcast listening still records as you listen.</p>;
  const search = query.trim().toLowerCase();
  const [from, to] = range ?? [0, PAGE];
  const shown = search ? state.episodes.filter(episode => episode.title.toLowerCase().includes(search)).slice(0, 30) : state.episodes.slice(from, to);
  const toggle = (guid: string) => { const next = new Set(picked); if (next.has(guid)) next.delete(guid); else next.add(guid); onChange(next); };
  return <div className={styles.field}>
    <span className={styles.label}>Which episodes? <em>{picked.size ? `${picked.size} picked` : "Tap to pick"}</em></span>
    <input className={styles.input} type="search" value={query} placeholder="Search episodes" onChange={event => setQuery(event.target.value)} />
    <div className={styles.episodes}>
      {!search && from > 0 ? <button type="button" className={styles.more} onClick={() => setRange([Math.max(0, from - PAGE), to])}>Show earlier episodes</button> : null}
      {shown.map(episode => {
        const elsewhere = episode.listenedOn !== null && episode.listenedOn !== dateKey && !picked.has(episode.guid);
        const on = picked.has(episode.guid);
        return <button key={episode.guid} type="button" className={styles.episode} aria-pressed={on} disabled={elsewhere} onClick={() => toggle(episode.guid)}>
          <span className={styles.tick} data-on={on ? "" : undefined} data-past={elsewhere ? "" : undefined} aria-hidden="true">{on || elsewhere ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
          <span className={styles.lineCopy}>
            <span className={styles.lineTitle}>{episode.title}</span>
            <span className={styles.lineMeta}>{elsewhere ? `Listened ${dayLabel(episode.listenedOn!)}` : [episode.duration, episode.isoDate ? `Released ${dayLabel(episode.isoDate.slice(0, 10))}` : null].filter(Boolean).join(" · ")}</span>
          </span>
        </button>;
      })}
      {!shown.length ? <p className={`${styles.hint} px-3 py-3`}>No episodes match.</p> : null}
      {!search && to < state.episodes.length ? <button type="button" className={styles.more} onClick={() => setRange([from, to + PAGE])}>Show more episodes</button> : null}
    </div>
  </div>;
}

export function TeachingSheet({ dateKey, sogp, podcast, report, available, onClose, onOptimistic }: {
  /** Optimistic (user request, 20 October): the row shows the teaching at once and the sheet closes. */
  onOptimistic?: OptimisticSave;
  dateKey: string;
  /** What SOGP and the podcast recorded by themselves that day, if anything. */
  sogp: string | null; podcast: string | null;
  report: TeachingReport | null; available: boolean; onClose: () => void;
}) {
  const { pending, error, save } = useSheetSave();
  // Any mix of SOGP, the podcast and Other (Pastor, 20 October).
  const [parts, setParts] = useState<TeachingParts>(() => report ? teachingParts(report.source, report.otherTitle)
    : { sogp: Boolean(sogp) || !podcast, podcast: Boolean(podcast), other: false });
  const [otherTitle, setOtherTitle] = useState(report?.otherTitle ?? "");
  const [note, setNote] = useState(report?.note ?? "");
  const lines = [
    parts.sogp ? { key: "sogp", title: "SOGP", detail: sogp } : null,
    // With episodes to pick, the picker below shows the podcast instead.
    parts.podcast && !available ? { key: "podcast", title: "Podcast", detail: podcast } : null,
  ].filter(line => line !== null);
  const toggle = (key: keyof TeachingParts) => setParts(current => ({ ...current, [key]: !current[key] }));
  const other = parts.other ? otherTitle.trim() : "";
  const ready = (parts.sogp || parts.podcast || parts.other) && (!parts.other || Boolean(other));
  // Podcast episodes picked for this day; `initialPicks` is what was already recorded on it.
  const [picks, setPicks] = useState<Set<string>>(new Set());
  const [initialPicks, setInitialPicks] = useState<Set<string> | null>(null);
  const podcastChange = () => {
    // Unticking Podcast never erases real listening; only the picker changes episodes.
    if (!initialPicks || !parts.podcast) return undefined;
    return { add: [...picks].filter(guid => !initialPicks.has(guid)), remove: [...initialPicks].filter(guid => !picks.has(guid)) };
  };
  const input = () => ({ dateKey, source: teachingSource(parts), otherTitle: other || null, note, podcast: podcastChange() });

  return <ReportSheet title="Teaching" subtitle="What did you learn from today?" onClose={onClose}
    footer={available ? close => <button type="button" className={styles.primary} disabled={pending || !ready} onClick={() => {
      if (!onOptimistic) { save(() => saveTeachingReportAction(input()), close); return; }
      onOptimistic({ teaching: `${teachingLabel(teachingSource(parts), other || null)}${note.trim() ? " · note added" : ""}` }, () => saveTeachingReportAction(input()));
      close();
    }}>{pending ? "Saving…" : "Save teaching"}</button> : undefined}>
    {() => <>
      <div className={styles.field}>
        <span className={styles.label}>Teaching from <em>Pick any</em></span>
        <div className={styles.chips}>
          {([["sogp", "SOGP"], ["podcast", "Podcast"], ["other", "Other"]] as const).map(([key, label]) => <button key={key} type="button" className={styles.chip} aria-pressed={parts[key]} onClick={() => toggle(key)}>
            {parts[key] ? <CheckIcon className="size-3.5" strokeWidth={2.6} aria-hidden="true" /> : null}{label}
          </button>)}
        </div>
      </div>
      {lines.length ? <div className={styles.box}>
        {lines.map(line => <div key={line.key} className={styles.line}>
          <span className={styles.tick} data-on={line.detail ? "" : undefined} aria-hidden="true">{line.detail ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
          <span className={styles.lineCopy}><span className={styles.lineTitle}>{line.title}</span><span className={styles.lineMeta}>{line.detail ? `${line.detail} · recorded as you ${line.key === "sogp" ? "learned" : "listened"}` : `Nothing recorded yet. It fills in as you ${line.key === "sogp" ? "learn" : "listen"}.`}</span></span>
        </div>)}
      </div> : null}
      {parts.podcast && available ? <PodcastPicker dateKey={dateKey} picked={picks} onChange={setPicks} onLoaded={initial => { setInitialPicks(initial); setPicks(new Set(initial)); }} /> : null}
      {parts.other && available ? <label className={styles.field}>
        <span className={styles.label}>What was the other teaching?</span>
        <input className={styles.input} maxLength={TEACHING_OTHER_MAX} value={otherTitle} placeholder="e.g. Sunday service, a sermon on YouTube" onChange={event => setOtherTitle(event.target.value)} />
      </label> : null}
      {available ? <label className={styles.field}>
        <span className={styles.label}>Anything to add? <em>Optional</em></span>
        <textarea className={styles.textarea} maxLength={TEACHING_NOTE_MAX} value={note} placeholder="A takeaway or a question" onChange={event => setNote(event.target.value)} />
      </label> : <p className={styles.hint}>SOGP and the podcast fill in as you learn and listen. You confirm them when you submit.</p>}
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    </>}
  </ReportSheet>;
}
