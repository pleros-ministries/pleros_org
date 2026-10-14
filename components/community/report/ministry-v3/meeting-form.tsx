"use client";
import { startTransition, useRef, useState } from "react";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { parseSharedMeeting } from "@/lib/community/reporting-v3-input";
import { shiftDate } from "@/lib/sogp/daily-date";
import { ReportContactPicker } from "./contact-picker";
import type { PersistContact } from "./ministry-form";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import styles from "./ministry-form.module.css";

export type SharedMeetingView = {
  id: number; unitId: number; kind: "teaching_meeting" | "prayer_meeting"; meetingDate: string;
  subject: string | null; venue: string | null; startsAt: string | null; endsAt: string | null; totalAttendance: number; creatorName?: string; ledByYou?: boolean;
};
export type MeetingReportPayload = {
  kind: "teaching_meeting" | "prayer_meeting"; subject: string; venue: string;
  startsAt: string | null; endsAt: string | null; totalAttendance: string;
  participation: "worker" | "disciple" | null; attended: boolean; contacts: string[];
};

const utc = (dateKey: string) => new Date(`${dateKey}T00:00:00Z`);
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const lagosTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "numeric", minute: "2-digit", hour12: true });
/** "13 Oct 2026" */
export const meetingDateShort = (dateKey: string) => dayMonthYear.format(utc(dateKey));
/** "Tue, 13 Oct 2026" */
export const meetingDateLong = (dateKey: string) => `${weekday.format(utc(dateKey))}, ${dayMonthYear.format(utc(dateKey))}`;
/** "6:00–7:15 pm · Lagos (WAT)" */
export function meetingTimes(startsAt: string, endsAt: string) {
  const [start, end] = [startsAt, endsAt].map(value => lagosTime.format(new Date(value)).replace(/\s/g, " "));
  const sameHalf = start.slice(-2) === end.slice(-2);
  return `${sameHalf ? start.replace(/ ?(am|pm)$/, "") : start}–${end} · Lagos (WAT)`;
}

/** Paper: Pleros-report-{teaching,prayer}-{led,attendee}. */
export function MeetingReportForm({ creating = false, initialKind = "teaching_meeting", dateKey, meeting, contacts, selectedContacts = [], initialReport, readOnly = false, onCreateContact, onSave, onCancel }: {
  creating?: boolean; initialKind?: "teaching_meeting" | "prayer_meeting"; dateKey: string; meeting?: SharedMeetingView;
  contacts: MinistryContact[]; selectedContacts?: MinistryContact[]; initialReport?: { attended: boolean; participation: "leader" | "worker" | "disciple" };
  readOnly?: boolean; onCreateContact?: PersistContact;
  onSave: (payload: MeetingReportPayload) => Promise<{ ok: true } | { ok: false; error: string }>; onCancel?: () => void;
}) {
  const [kind, setKind] = useState(initialKind), [subject, setSubject] = useState(""), [venue, setVenue] = useState(""), [startTime, setStartTime] = useState(""), [endTime, setEndTime] = useState(""), [endsNextDay, setEndsNextDay] = useState(false), [total, setTotal] = useState("");
  const [attended, setAttended] = useState<boolean | null>(initialReport?.attended ?? null);
  const [participation, setParticipation] = useState<"worker" | "disciple" | "">(initialReport?.participation === "worker" || initialReport?.participation === "disciple" ? initialReport.participation : "");
  const [people, setPeople] = useState(selectedContacts), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState<string | null>(null);
  const lock = useRef(false), attendanceGroup = useRef<HTMLDivElement>(null);
  const leader = creating || initialReport?.participation === "leader" || Boolean(meeting?.ledByYou);
  const nextDay = shiftDate(dateKey, 1);
  function save() {
    if (lock.current || readOnly || saved) return;
    if (!leader && !participation) { setError("Choose Worker or Disciple."); document.getElementById("meeting-part")?.focus(); return; }
    if (attended === null) { setError("Confirm whether you attended."); attendanceGroup.current?.querySelector<HTMLButtonElement>("button")?.focus(); return; }
    // Overnight prayer stays on its Lagos start day; the next-day end is only ever explicit.
    const startsAt = kind === "prayer_meeting" && startTime ? `${dateKey}T${startTime}+01:00` : null;
    const endsAt = kind === "prayer_meeting" && endTime ? `${endsNextDay ? nextDay : dateKey}T${endTime}+01:00` : null;
    const payload: MeetingReportPayload = { kind, subject: kind === "teaching_meeting" ? subject : "", venue: kind === "prayer_meeting" ? venue : "", startsAt, endsAt, totalAttendance: total, participation: participation || null, attended, contacts: people.map(row => row.key) };
    if (creating) {
      try { parseSharedMeeting(payload); } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Check the meeting details.";
        setError(kind === "prayer_meeting" && startTime && endTime && !endsNextDay && endTime <= startTime ? "The end is before the start. If the meeting ended after midnight, tick “Ends the next day”." : message);
        return;
      }
    }
    lock.current = true; setBusy(true); setError(null);
    startTransition(async () => {
      try { const result = await onSave(payload); if (result.ok) setSaved(true); else setError(result.error); }
      catch { setError("Your report could not be saved. Your entries are still here. Try again."); }
      finally { lock.current = false; setBusy(false); }
    });
  }
  const label = kind === "teaching_meeting" ? "Teaching" : "Prayer";
  return <div className={styles.form}>
    <fieldset className={styles.controls} disabled={busy || saved || readOnly}><legend className={styles.srOnly}>Meeting report</legend>
      {creating ? <>
        <div className={styles.titleBlock}><h1>{label} meeting</h1><p className={styles.muted}>Create the shared meeting and your report.</p></div>
        <section className={styles.section}><h2>Meeting details</h2>
          <div className={styles.pair}>
            <label className={styles.field}>Meeting type<select value={kind} onChange={event => { setKind(event.target.value as typeof kind); setSubject(""); setVenue(""); setStartTime(""); setEndTime(""); setEndsNextDay(false); }}><option value="teaching_meeting">Teaching</option><option value="prayer_meeting">Prayer</option></select></label>
            <div className={styles.field}>Date<span className={styles.readonlyField}>{meetingDateShort(dateKey)}<DashboardIcon name="calendar" size={16} /></span></div>
          </div>
          {kind === "teaching_meeting" ? <div className={styles.fieldGroup}><label className={styles.field}>Meeting subject<input maxLength={500} value={subject} onChange={event => setSubject(event.target.value)} /></label><p className={styles.muted}>Shown when others choose this meeting.</p></div> : <>
            <label className={styles.field}>Venue<input maxLength={120} value={venue} onChange={event => setVenue(event.target.value)} /></label>
            <div className={styles.pair}>
              <label className={styles.field}>Start · Lagos (WAT)<input type="time" value={startTime} onChange={event => setStartTime(event.target.value)} /></label>
              <label className={styles.field}>End · Lagos (WAT)<input type="time" value={endTime} onChange={event => setEndTime(event.target.value)} /></label>
            </div>
            <label className={styles.check}><input type="checkbox" checked={endsNextDay} onChange={event => setEndsNextDay(event.target.checked)} />Ends the next day ({meetingDateShort(nextDay)})</label>
          </>}
        </section>
      </> : meeting ? <>
        <div className={styles.existingHead}><span className={styles.eyebrow}>Existing meeting</span>{onCancel ? <button type="button" className={styles.textButton} onClick={onCancel}>Change meeting</button> : null}</div>
        <h1>{meeting.subject ?? "Prayer meeting"}</h1>
        <div className={styles.lockedPanel}>
          <div className={styles.lockedTop}><StatusPill tone={meeting.kind === "teaching_meeting" ? "lilac" : "blue"}>{meeting.kind === "teaching_meeting" ? "Teaching" : "Prayer"}</StatusPill><DashboardIcon name="lock" size={16} /></div>
          <p>{meetingDateLong(meeting.meetingDate)}</p>
          {meeting.venue ? <p>{meeting.venue}</p> : null}
          {meeting.startsAt && meeting.endsAt ? <p className={styles.muted}>{meetingTimes(meeting.startsAt, meeting.endsAt)}</p> : null}
          {meeting.creatorName ? <p className={styles.muted}>Created by {meeting.creatorName}</p> : null}
        </div>
        <p className={styles.muted}>Meeting details are read-only.</p>
      </> : null}
      {leader ? <div className={styles.reportHead}><h2>Your report</h2><StatusPill tone="blue">Led the meeting</StatusPill></div>
        : <div className={styles.fieldGroup}><label className={styles.field} htmlFor="meeting-part">Your part in this meeting<select id="meeting-part" value={participation} onChange={event => setParticipation(event.target.value as typeof participation)}><option value="" disabled>Choose your part</option><option value="worker">Worker</option><option value="disciple">Disciple</option></select></label><p className={styles.muted}>Worker · Disciple</p></div>}
      <div className={styles.section}><h2 id="meeting-attended">I attended</h2>
        <div ref={attendanceGroup} className={styles.segmented} role="radiogroup" aria-labelledby="meeting-attended">{[true, false].map(value => <button key={String(value)} type="button" role="radio" aria-checked={attended === value} onClick={() => setAttended(value)}>{value ? "Yes" : "No"}</button>)}</div>
      </div>
      <ReportContactPicker available={contacts} selected={people} onChange={setPeople} onCreate={onCreateContact} disabled={busy || saved || readOnly} />
      {creating ? <section className={styles.section}><h2>Meeting totals</h2><label className={styles.field}>Total meeting attendance<input inputMode="numeric" placeholder="Enter total" value={total} onChange={event => setTotal(event.target.value)} /></label><p className={styles.muted}>Includes you and everyone present.</p></section> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {saved ? <p role="status">Report saved.</p> : null}
      <div className={styles.footer}><button type="button" className={styles.primary} disabled={busy || saved || readOnly} onClick={save}>{readOnly ? "This report is view only" : busy ? "Saving…" : saved ? "Report saved" : creating ? "Create meeting & save report" : "Save my attendance report"}<DashboardIcon name="check" /></button>
        {creating && onCancel ? <button type="button" className={styles.textButton} disabled={busy} onClick={onCancel}>Back to meetings</button> : null}</div>
    </fieldset>
  </div>;
}
