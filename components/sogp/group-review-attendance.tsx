"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { confirmGroupReviewAttendance, correctGroupReviewAttendance } from "@/app/_actions/sogp-group-review-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { GroupAttendanceSheet } from "@/lib/db/queries/sogp-group-reviews";
import styles from "./group-reviews.module.css";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";

const lagosDay = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short" });

export function GroupReviewAttendance({ data, preview = false }: { data: GroupAttendanceSheet; preview?: boolean }) {
  const [marks, setMarks] = useState<Record<number, "attended" | "missed">>({});
  const [correcting, setCorrecting] = useState<Record<number, true>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [correctingSaving, startCorrectSave] = useTransition();
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
  function saveCorrections() {
    if (preview) { setError("This visual preview does not save attendance."); return; }
    const changed = Object.entries(marks)
      .map(([id, status]) => ({ enrollmentId: Number(id), status }))
      .filter(mark => {
        const learner = data.learners.find(row => row.enrollmentId === mark.enrollmentId);
        return learner?.status && correcting[mark.enrollmentId] && learner.status !== mark.status;
      });
    if (!changed.length) { setError("Choose a different mark for at least one learner to correct."); return; }
    startCorrectSave(async () => {
      try {
        const result = await correctGroupReviewAttendance({ reviewId: data.id, marks: changed });
        if (!result.ok) { setError(result.error); return; }
        setMarks({}); setCorrecting({}); setError(null); router.refresh();
      } catch { setError("Corrections could not be saved. Your selections are still here; try again."); }
    });
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Record group attendance</h1><p className={styles.meta}>As session leader · you’re confirming the existing review session</p></header>
    <article className={`${styles.reviewCard} ${styles.lockedSummary}`}><h2 data-dashboard-learning-title className={styles.attendanceTitle}>{data.title}</h2><p className={styles.meta}>{data.groupName}</p><p>{groupReviewTimeLabel(data.startsAt, data.endsAt)}</p><p className={styles.meta}>{data.venue} · Lagos (WAT)</p><p className={styles.lockedLine}><span className={styles.meta}>Session leader · {data.leaderName}</span><DashboardIcon name="lock" size={16} /></p></article>
    {!afterReview ? <p className={styles.info}>Attendance can be confirmed after this review has taken place.</p> : null}
    <section className={styles.section}><h2>Learners</h2>{data.learners.length ? <div className={styles.attendeeList}>{data.learners.map(learner => {
      const selected = learner.status ?? marks[learner.enrollmentId];
      const isCorrecting = Boolean(correcting[learner.enrollmentId]);
      return <article className={styles.attendee} key={learner.enrollmentId}>
        <div className={styles.person}><span className={styles.avatar} aria-hidden="true">{learner.name.slice(0,2).toUpperCase()}</span><div><strong>{learner.name}</strong><p className={styles.meta}>{learner.path === "podcast_two" ? "Two podcasts a day" : learner.path === "podcast_one" ? "One podcast a day" : "Traditional path"}</p>{learner.originalStatus ? <p className={styles.meta}>Originally {learner.originalStatus} · corrected {learner.confirmedAt ? lagosDay.format(new Date(learner.confirmedAt)) : ""}</p> : null}</div><span className={styles.pill} data-tone={learner.status === "attended" ? "done" : learner.status === "missed" ? "todo" : undefined}>{learner.status === "attended" ? "Attended" : learner.status === "missed" ? "Missed" : "Unconfirmed"}</span></div>
        <div className={styles.attendanceChoices} role="group" aria-label={`${learner.name} attendance`}>{(["attended", "missed"] as const).map(status => <button type="button" key={status} aria-pressed={selected === status} disabled={saving || correctingSaving || !afterReview || (Boolean(learner.status) && !isCorrecting)} onClick={() => setMarks(previous => { const next = { ...previous }; if (next[learner.enrollmentId] === status) delete next[learner.enrollmentId]; else next[learner.enrollmentId] = status; return next; })}>{status === "attended" ? "Attended" : "Missed"}</button>)}</div>
        {learner.status && learner.correctable && !isCorrecting ? <button type="button" className={styles.textButton} disabled={saving || correctingSaving || preview} onClick={() => { setCorrecting(previous => ({ ...previous, [learner.enrollmentId]: true })); setMarks(previous => ({ ...previous, [learner.enrollmentId]: learner.status ?? "attended" })); }}>Correct</button> : null}
      </article>;
    })}</div> : <p className={styles.empty}>No eligible current learners in this review’s group. The group lead does not confirm their own attendance.</p>}</section>
    <p className={styles.info}>Learners do not confirm their own reviews. Unmarked people stay unconfirmed, and learning continues while make-up is pending.</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <footer className={styles.footer}><button type="button" className={styles.primary} disabled={preview || saving || !afterReview || !data.learners.some(learner => !learner.status)} onClick={save}>{saving ? "Saving…" : "Confirm attendance"}<DashboardIcon name="check" /></button>{Object.keys(correcting).length ? <button type="button" className={styles.primary} disabled={preview || correctingSaving} onClick={saveCorrections}>{correctingSaving ? "Saving…" : "Save corrections"}<DashboardIcon name="check" /></button> : null}</footer>
  </section>;
}
