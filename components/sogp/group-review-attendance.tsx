"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmGroupReviewAttendance } from "@/app/_actions/sogp-group-review-actions";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import type { GroupAttendanceSheet } from "@/lib/db/queries/sogp-group-reviews";
import styles from "./group-reviews.module.css";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";

export function GroupReviewAttendance({ data, preview = false }: { data: GroupAttendanceSheet; preview?: boolean }) {
  const [marks, setMarks] = useState<Record<number, "attended" | "missed">>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const afterReview = new Date(data.endsAt).getTime() <= now;
  function save() {
    if (preview) { setError("This visual preview does not save attendance."); return; }
    const selected = Object.entries(marks).map(([id,status]) => ({ enrollmentId: Number(id), status }));
    if (!selected.length) { setError("Choose Attended or Missed for at least one learner. Unmarked people stay unconfirmed."); return; }
    startSave(async () => {
      try {
        const result = await confirmGroupReviewAttendance({ reviewId: data.id, marks: selected });
        if (!result.ok) { setError(result.error); return; }
        setMarks({}); setError(null); router.refresh();
      } catch { setError("Attendance could not be saved. Your selections are still here; try again."); }
    });
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Record group attendance</h1><StatusPill tone="lilac">Session leader</StatusPill></header>
    <article className={`${styles.reviewCard} ${styles.lockedSummary}`}><h2 data-dashboard-learning-title className={styles.attendanceTitle}>{data.title}</h2><p className={styles.meta}>{data.groupName}</p><p>{groupReviewTimeLabel(data.startsAt, data.endsAt)}</p><p className={styles.meta}>{data.venue} · Lagos (WAT)</p><p className={styles.lockedLine}><span className={styles.meta}>Session leader · {data.leaderName}</span><DashboardIcon name="lock" size={16} /></p></article>
    <p className={styles.meta}>You’re confirming the existing review session.</p>
    {!afterReview ? <p className={styles.info}>Attendance can be confirmed after this review has taken place.</p> : null}
    <section className={styles.section}><h2>Learners</h2>{data.learners.length ? data.learners.map(learner => {
      const selected = learner.status ?? marks[learner.enrollmentId];
      return <article className={styles.attendee} key={learner.enrollmentId}>
        <div className={styles.person}><span className={styles.avatar} aria-hidden="true">{learner.name.slice(0,2).toUpperCase()}</span><div><strong>{learner.name}</strong><p className={styles.meta}>{learner.path === "podcast_two" ? "Two podcasts a day" : learner.path === "podcast_one" ? "One podcast a day" : "Traditional path"}</p></div><StatusPill tone={learner.status === "attended" ? "green" : "amber"}>{learner.status === "attended" ? "Attended" : learner.status === "missed" ? "Missed" : "Unconfirmed"}</StatusPill></div>
        <div className={styles.attendanceChoices} role="group" aria-label={`${learner.name} attendance`}>{(["attended", "missed"] as const).map(status => <button type="button" key={status} aria-pressed={selected === status} disabled={saving || !afterReview || Boolean(learner.status)} onClick={() => setMarks(previous => { const next = { ...previous }; if (next[learner.enrollmentId] === status) delete next[learner.enrollmentId]; else next[learner.enrollmentId] = status; return next; })}>{status === "attended" ? "Attended" : "Missed"}</button>)}</div>
      </article>;
    }) : <p className={styles.empty}>No eligible current learners in this review’s group. The group lead does not confirm their own attendance.</p>}</section>
    <div className={styles.info}><p>Learners do not confirm their own reviews.<br />Unmarked people stay unconfirmed.<br />Learning continues while make-up is pending.</p></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <footer className={styles.footer}><button type="button" className={styles.primary} disabled={preview || saving || !afterReview || !data.learners.some(learner => !learner.status)} onClick={save}>{saving ? "Saving…" : "Confirm attendance"}<DashboardIcon name="check" /></button></footer>
  </section>;
}
