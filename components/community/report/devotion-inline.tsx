"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { saveBibleReadingLogAction, togglePrayerWatchAttendanceAction } from "@/app/_actions/prayer-watch-actions";
import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import { PRAYER_WATCH_SESSIONS } from "@/lib/prayer-watch";
import styles from "./daily-report-sections.module.css";

/**
 * Devotion entries filled in place on My reports (user, 18 October): Prayer
 * Watch sessions toggle where you are, Bible reading saves from a small form.
 * Both use the same actions as the Prayer Watch page.
 */

export function PrayerWatchInline({ date, attended, disabled }: { date: string; attended: string[]; disabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(attended));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function toggle(session: string) {
    const was = on.has(session);
    setOn(current => { const next = new Set(current); if (was) next.delete(session); else next.add(session); return next; });
    setError(null);
    start(async () => {
      const form = new FormData();
      form.set("date", date); form.set("session", session); form.set("attended", String(was));
      const result = await togglePrayerWatchAttendanceAction({ error: null }, form);
      if (result.error) {
        setError(result.error);
        setOn(current => { const next = new Set(current); if (was) next.add(session); else next.delete(session); return next; });
        return;
      }
      router.refresh();
    });
  }
  return <div className={styles.inlineForm}>
    <p className={styles.hint}>Tap each session you joined, live or as a replay.</p>
    <div className={styles.sessionRow}>
      {PRAYER_WATCH_SESSIONS.map(session => <button key={session.id} type="button" aria-pressed={on.has(session.id)} disabled={disabled || pending} onClick={() => toggle(session.id)} className={styles.sessionChip}>
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
