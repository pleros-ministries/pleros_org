"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { saveBibleReadingLogAction, togglePrayerWatchAttendanceAction } from "@/app/_actions/prayer-watch-actions";
import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import { PRAYER_WATCH_SESSIONS } from "@/lib/prayer-watch";
import { PRAYER_WATCH_ANOTHER_TIME } from "@/lib/prayer-watch-session";
import styles from "./daily-report-sections.module.css";

/**
 * Devotion entries filled in place on My reports (user, 18 October): Prayer
 * Watch sessions toggle where you are, Bible reading saves from a small form.
 * Both use the same actions as the Prayer Watch page.
 */

/**
 * Optimistic (user request, 20 October): a tap shows at once and reports up
 * through `onChange`, so the report row updates without waiting; a failed save
 * rolls that session back and says so. Chips never lock while saving.
 */
export function PrayerWatchInline({ date, attended, disabled, onChange }: { date: string; attended: string[]; disabled: boolean; onChange?: (sessions: string[]) => void }) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(attended));
  // The latest set, so a rollback after several quick taps undoes only its own session.
  const current = useRef(on);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();
  const sessions = [...PRAYER_WATCH_SESSIONS.map(session => ({ id: session.id as string, label: session.label, time: session.time })), { id: PRAYER_WATCH_ANOTHER_TIME.id as string, label: PRAYER_WATCH_ANOTHER_TIME.label, time: "Outside these times" }];
  function apply(next: Set<string>) { current.current = next; setOn(next); onChange?.([...next]); }
  function toggle(session: string) {
    const was = current.current.has(session);
    const next = new Set(current.current); if (was) next.delete(session); else next.add(session);
    apply(next);
    setError(null);
    start(async () => {
      const form = new FormData();
      form.set("date", date); form.set("session", session); form.set("attended", String(was));
      const result = await togglePrayerWatchAttendanceAction({ error: null }, form).catch(() => ({ error: "That couldn’t be saved. Try again." }));
      if (result.error) {
        setError(result.error);
        const back = new Set(current.current); if (was) back.add(session); else back.delete(session);
        apply(back);
        return;
      }
      router.refresh();
    });
  }
  return <div className={styles.inlineForm}>
    <p className={styles.hint}>Tap each time you prayed, live or as a replay.</p>
    <div className={styles.sessionRow}>
      {sessions.map(session => <button key={session.id} type="button" aria-pressed={on.has(session.id)} disabled={disabled} onClick={() => toggle(session.id)} className={styles.sessionChip} data-wide={session.id === PRAYER_WATCH_ANOTHER_TIME.id || undefined}>
        <span>{session.label}</span><span className={styles.meta}>{session.time}</span>
      </button>)}
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
