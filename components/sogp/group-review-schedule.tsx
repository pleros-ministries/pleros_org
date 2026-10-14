"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import styles from "./group-reviews.module.css";
import type { GroupReviewScheduleInput } from "@/lib/sogp/group-review";

export type ReviewGroupChoice = { id: number; name: string; leaderName: string };

/** Paper schedule presenter. Caller supplies scoped choices and the server action. */
export function GroupReviewSchedule({ groups, schedule }: {
  groups: ReviewGroupChoice[];
  schedule: (input: GroupReviewScheduleInput) => Promise<{ ok: true; groupId: number } | { ok: false; error: string }>;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? 0);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const group = groups.find(item => item.id === groupId);
  const [venue, setVenue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [requestKey] = useState(() => crypto.randomUUID());
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  function submit() {
    const fields = [title.trim(), date, startTime, endTime, venue.trim()];
    const firstMissing = fields.findIndex(value => !value);
    if (firstMissing >= 0) {
      setError("Complete the review details before scheduling.");
      form.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-review-field]")[firstMissing]?.focus();
      return;
    }
    startSave(async () => {
      try {
        const result = await schedule({ groupId, title, date, startTime, endTime, venue, requestKey });
        if (!result.ok) { setError(result.error); return; }
        router.push(`/dashboard/sogp/reviews?group=${result.groupId}`); router.refresh();
      } catch { setError("The review could not be scheduled. Your details are still here; try again."); }
    });
  }
  if (!groups.length) return <section className={styles.page}><header className={styles.heading}><h1>Plan your weekly review</h1></header><p className={styles.info}>You don’t lead an active discipleship group. Paused or closed groups cannot schedule reviews.</p></section>;
  return <form className={styles.page} ref={form} noValidate onSubmit={event => { event.preventDefault(); submit(); }}>
    <header className={styles.heading}><h1>Plan your weekly review</h1><StatusPill tone="lilac">Discipler</StatusPill></header>
    <section className={styles.section}><h2>Group</h2><div className={styles.groupPanel}>
      {groups.length === 1 ? <strong>{group?.name}</strong> : <select aria-label="Discipleship group" value={groupId} onChange={event => { setGroupId(Number(event.target.value)); }}>{groups.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
      <p className={styles.meta}>Traditional and podcast learners</p>
    </div></section>
    <section className={styles.section}><h2>Review details</h2>
      <label className={styles.field}>Review title<input data-review-field value={title} maxLength={160} disabled={saving} onChange={event => setTitle(event.target.value)} /></label>
      <label className={styles.field}>Date<input data-review-field type="date" value={date} disabled={saving} onChange={event => setDate(event.target.value)} /></label>
      <div className={styles.times}><label className={styles.field}>Start · Lagos (WAT)<input data-review-field type="time" value={startTime} disabled={saving} onChange={event => setStartTime(event.target.value)} /></label><label className={styles.field}>End · Lagos (WAT)<input data-review-field type="time" value={endTime} disabled={saving} onChange={event => setEndTime(event.target.value)} /></label></div>
      <label className={styles.field}>Venue<input data-review-field value={venue} maxLength={300} disabled={saving} onChange={event => setVenue(event.target.value)} /></label>
      <label className={styles.field}>Session leader<input readOnly value={group?.leaderName ?? ""} /><span className={styles.meta}>Only this group’s lead can lead the session and confirm attendance.</span></label>
    </section>
    <div className={styles.info}><p>The session leader confirms attendance on this review after it takes place.<br />Scheduling does not confirm attendance.</p></div>
    <p className={styles.meta}>The same review appears in the group’s list.</p>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <footer className={styles.footer}><button type="submit" className={styles.primary} disabled={saving}>{saving ? "Scheduling…" : "Schedule group review"}<DashboardIcon name="arrow" /></button></footer>
  </form>;
}
