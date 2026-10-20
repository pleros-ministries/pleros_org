"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { saveBibleReadingLogAction, savePrayerOtherTimeAction, togglePrayerWatchAttendanceAction } from "@/app/_actions/prayer-watch-actions";
import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import { PRAYER_WATCH_SESSIONS } from "@/lib/prayer-watch";
import { PRAYER_WATCH_ANOTHER_TIME } from "@/lib/prayer-watch-session";
import styles from "./daily-report-sections.module.css";

/**
 * Devotion entries filled in place on My reports (user, 18 October): Prayer
 * Watch sessions toggle where you are, Bible reading saves from a small form.
 * Both use the same actions as the Prayer Watch page.
 */

const clock = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
/** "22:15" → "10:15 pm". */
export const prayerTimeLabel = (time: string) => clock.format(new Date(`1970-01-01T${time}:00Z`)).replace(/\s/g, " ").toLowerCase();

/**
 * Optimistic (user request, 20 October): a tap shows at once and reports up
 * through `onChange`, so the report row updates without waiting; a failed save
 * rolls it back and says so. Nothing locks while saving.
 *
 * "Another time" (user request, 20 October, for people who miss Prayer Watch):
 * add the times you actually prayed. While any time is saved the day keeps its
 * `unspecified` session, which is what every attendance count reads.
 */
export function PrayerWatchInline({ date, attended, times: initialTimes = [], disabled, onChange }: {
  date: string; attended: string[]; times?: string[]; disabled: boolean;
  /** The day's sessions and times after every change, for the report row. */
  onChange?: (sessions: string[], times: string[]) => void;
}) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(attended));
  const [times, setTimes] = useState<string[]>(() => [...initialTimes].sort());
  const [draft, setDraft] = useState("");
  // The latest values, so a rollback after several quick taps undoes only its own change.
  const current = useRef({ on, times });
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const another = PRAYER_WATCH_ANOTHER_TIME.id as string;
  function apply(next: { on: Set<string>; times: string[] }) {
    current.current = next; setOn(next.on); setTimes(next.times); onChange?.([...next.on], next.times);
  }
  function failed(message: string, undo: () => { on: Set<string>; times: string[] }) {
    setError(message); apply(undo());
  }
  function toggle(session: string) {
    const was = current.current.on.has(session);
    const next = new Set(current.current.on); if (was) next.delete(session); else next.add(session);
    apply({ ...current.current, on: next });
    setError(null);
    start(async () => {
      const form = new FormData();
      form.set("date", date); form.set("session", session); form.set("attended", String(was));
      const result = await togglePrayerWatchAttendanceAction({ error: null }, form).catch(() => ({ error: "That couldn’t be saved. Try again." }));
      if (result.error) return failed(result.error, () => { const back = new Set(current.current.on); if (was) back.add(session); else back.delete(session); return { ...current.current, on: back }; });
      router.refresh();
    });
  }
  function changeTime(time: string, remove: boolean) {
    const nextTimes = remove ? current.current.times.filter(item => item !== time) : [...new Set([...current.current.times, time])].sort();
    const nextOn = new Set(current.current.on); if (nextTimes.length) nextOn.add(another); else nextOn.delete(another);
    apply({ on: nextOn, times: nextTimes });
    setError(null); setDraft("");
    start(async () => {
      const result = await savePrayerOtherTimeAction({ date, time, remove }).catch(() => ({ error: "That couldn’t be saved. Try again." }));
      if (result.error) return failed(result.error, () => {
        const times = remove ? [...new Set([...current.current.times, time])].sort() : current.current.times.filter(item => item !== time);
        const back = new Set(current.current.on); if (times.length) back.add(another); else back.delete(another);
        return { on: back, times };
      });
      router.refresh();
    });
  }
  // A day ticked as "another time" before times existed has the session but no time.
  const untimed = on.has(another) && !times.length;
  return <div className={styles.inlineForm}>
    <p className={styles.hint}>Tap each session you joined, live or as a replay.</p>
    <div className={styles.sessionRow}>
      {PRAYER_WATCH_SESSIONS.map(session => <button key={session.id} type="button" aria-pressed={on.has(session.id)} disabled={disabled} onClick={() => toggle(session.id)} className={styles.sessionChip}>
        <span>{session.label}</span><span className={styles.meta}>{session.time}</span>
      </button>)}
    </div>
    <div className={styles.otherTimes}>
      <span className={styles.otherTitle}>Prayed at another time?</span>
      <span className={styles.meta}>Missed a session? Add when you prayed.</span>
      {times.length || untimed ? <div className={styles.timeChips}>
        {times.map(time => <button key={time} type="button" className={styles.timeChip} disabled={disabled} onClick={() => changeTime(time, true)} aria-label={`Remove ${prayerTimeLabel(time)}`}>{prayerTimeLabel(time)}<span aria-hidden="true">×</span></button>)}
        {untimed ? <button type="button" className={styles.timeChip} disabled={disabled} onClick={() => toggle(another)} aria-label="Remove another time">Another time<span aria-hidden="true">×</span></button> : null}
      </div> : null}
      <form className={styles.timeAdd} onSubmit={event => { event.preventDefault(); if (draft) changeTime(draft, false); }}>
        <label className={styles.srOnly} htmlFor={`prayer-time-${date}`}>Time you prayed</label>
        <input id={`prayer-time-${date}`} type="time" value={draft} disabled={disabled} onChange={event => setDraft(event.target.value)} />
        <button type="submit" className={styles.done} disabled={disabled || !draft}>Add</button>
      </form>
    </div>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
  </div>;
}

export function BibleReadingInline({ date, initial, disabled, onSaved }: { date: string; initial: { chapters: number; book: string; chapter: number } | null; disabled: boolean; onSaved?: () => void }) {
  const router = useRouter();
  const [chapters, setChapters] = useState(initial ? String(initial.chapters) : "");
  const [book, setBook] = useState(initial?.book ?? "");
  const [chapter, setChapter] = useState(initial ? String(initial.chapter) : "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const max = getBibleBook(book)?.chapters;
  return <form className={styles.inlineForm} onSubmit={event => {
    event.preventDefault();
    setError(null); setSaved(false);
    start(async () => {
      const form = new FormData();
      form.set("date", date); form.set("chaptersRead", chapters); form.set("currentBook", book); form.set("currentChapter", chapter);
      const result = await saveBibleReadingLogAction({ error: null }, form);
      if (result.error) { setError(result.error); return; }
      setSaved(true); router.refresh(); onSaved?.();
    });
  }}>
    <div className={styles.fieldRow}>
      <label className={styles.field}><span>Chapters read</span><input type="number" inputMode="numeric" min={1} max={150} required value={chapters} onChange={event => setChapters(event.target.value)} disabled={disabled || pending} /></label>
    </div>
    <div className={styles.fieldRow}>
      <label className={styles.field} style={{ flex: 2 }}><span>Now reading</span>
        <select required value={book} onChange={event => setBook(event.target.value)} disabled={disabled || pending}>
          <option value="" disabled>Choose a book</option>
          {BIBLE_BOOKS.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
        </select>
      </label>
      <label className={styles.field}><span>Chapter</span><input type="number" inputMode="numeric" min={1} max={max ?? 150} required value={chapter} onChange={event => setChapter(event.target.value)} disabled={disabled || pending} /></label>
    </div>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <div className={styles.rowActions}>{saved ? <span className={styles.meta}>Saved</span> : <span />}<button type="submit" className={styles.done} disabled={disabled || pending}>{pending ? "Saving…" : "Save reading"}</button></div>
  </form>;
}
