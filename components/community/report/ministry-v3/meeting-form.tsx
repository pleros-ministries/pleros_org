"use client";
import { startTransition, useRef, useState } from "react";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { parseSharedMeeting } from "@/lib/community/reporting-v3-input";
import { ReportContactPicker } from "./contact-picker";
import type { PersistContact } from "./ministry-form";
import { StatusPill } from "@/components/dashboard/v3/primitives";
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
export function MeetingReportForm({ creating = false, initialKind = "teaching_meeting", dateKey, meeting, contacts, selectedContacts = [], initialReport, readOnly = false, onCreateContact, onSave, onCancel }: {
  creating?: boolean; initialKind?: "teaching_meeting" | "prayer_meeting"; dateKey: string; meeting?: SharedMeetingView;
  contacts: MinistryContact[]; selectedContacts?: MinistryContact[]; initialReport?: { attended: boolean; participation: "leader" | "worker" | "disciple" };
  readOnly?: boolean; onCreateContact?: PersistContact;
  onSave: (payload: MeetingReportPayload) => Promise<{ ok: true } | { ok: false; error: string }>; onCancel?: () => void;
}) {
  const [kind, setKind] = useState(initialKind), [subject, setSubject] = useState(""), [venue, setVenue] = useState(""), [startsAt, setStartsAt] = useState(""), [endsAt, setEndsAt] = useState(""), [total, setTotal] = useState("");
  const [attended, setAttended] = useState<boolean | null>(initialReport?.attended ?? null);
  const [participation, setParticipation] = useState<"worker" | "disciple" | null>(initialReport?.participation === "worker" || initialReport?.participation === "disciple" ? initialReport.participation : null);
  const [people, setPeople] = useState(selectedContacts), [busy, setBusy] = useState(false), [saved, setSaved] = useState(false), [error, setError] = useState<string | null>(null);
  const lock = useRef(false), attendanceGroup = useRef<HTMLFieldSetElement>(null);
  const leader = creating || initialReport?.participation === "leader" || Boolean(meeting?.ledByYou);
  function save() {
    if (lock.current || readOnly || saved) return;
    if (attended === null) { setError("Confirm whether you attended."); attendanceGroup.current?.querySelector<HTMLInputElement>("input")?.focus(); return; }
    if (!leader && participation === null) { setError("Choose Worker or Disciple."); return; }
    const payload: MeetingReportPayload = { kind, subject, venue, startsAt: startsAt ? `${startsAt}+01:00` : null, endsAt: endsAt ? `${endsAt}+01:00` : null, totalAttendance: total, participation, attended, contacts: people.map(row => row.key) };
    if (creating) try { parseSharedMeeting(payload); } catch (caught) { setError(caught instanceof Error ? caught.message : "Check the meeting details."); return; }
    lock.current = true; setBusy(true); setError(null);
    startTransition(async () => {
      try { const result = await onSave(payload); if (result.ok) setSaved(true); else setError(result.error); }
      catch { setError("Your report could not be saved. Your entries are still here. Try again."); }
      finally { lock.current = false; setBusy(false); }
    });
  }
  return <div className={styles.form}>
    <fieldset className={styles.controls} disabled={busy || saved || readOnly}><legend className={styles.srOnly}>Meeting report</legend>
      <h1>{creating ? "Create meeting" : "Report attendance"}</h1>
      <p className={styles.muted}>{dateKey} · Lagos (WAT)</p>
      {creating ? <>
        <h2>Meeting details</h2>
        <label className={styles.field}>Meeting type<select value={kind} onChange={event => { setKind(event.target.value as typeof kind); setSubject(""); setVenue(""); setStartsAt(""); setEndsAt(""); }}><option value="teaching_meeting">Teaching</option><option value="prayer_meeting">Prayer</option></select></label>
        {kind === "teaching_meeting" ? <label className={styles.field}>Meeting subject *<input maxLength={500} value={subject} onChange={event => setSubject(event.target.value)} /></label> : <>
          <label className={styles.field}>Venue *<input maxLength={120} value={venue} onChange={event => setVenue(event.target.value)} /></label>
          <label className={styles.field}>Start · Lagos (WAT) *<input type="datetime-local" value={startsAt} onChange={event => setStartsAt(event.target.value)} /></label>
          <label className={styles.field}>End · Lagos (WAT) *<input type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} /></label>
        </>}
      </> : meeting ? <div className={styles.privacy}>
        <StatusPill tone={meeting.kind === "teaching_meeting" ? "lilac" : "blue"}>{meeting.kind === "teaching_meeting" ? "Teaching" : "Prayer"}</StatusPill>
        <h2>{meeting.subject ?? "Prayer meeting"}</h2><p>{meeting.meetingDate}</p>
        {meeting.venue ? <p>{meeting.venue}</p> : null}
        {meeting.startsAt && meeting.endsAt ? <p>{[meeting.startsAt, meeting.endsAt].map(value => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }).format(new Date(value))).join("–")} · Lagos (WAT)</p> : null}
        {meeting.creatorName ? <p>Created by {meeting.creatorName}</p> : null}
        <p>Meeting details are read-only.</p>
      </div> : null}
      <h2>Your report</h2>
      {leader ? <StatusPill tone="blue">Led the meeting</StatusPill> : <fieldset className={styles.kind}><legend>Your part in this meeting *</legend>{(["worker", "disciple"] as const).map(role => <label key={role}><input type="radio" name="meeting-participation" checked={participation === role} onChange={() => setParticipation(role)} /><span>{role === "worker" ? "Worker" : "Disciple"}</span></label>)}</fieldset>}
      <fieldset ref={attendanceGroup} className={styles.kind}><legend>I attended *</legend>{[true, false].map(value => <label key={String(value)}><input type="radio" name="meeting-attended" checked={attended === value} onChange={() => setAttended(value)} /><span>{value ? "Yes" : "No"}</span></label>)}</fieldset>
      <ReportContactPicker available={contacts} selected={people} onChange={setPeople} onCreate={onCreateContact} disabled={busy || saved || readOnly} />
      {creating ? <><h2>Meeting totals</h2><label className={styles.field}>Total meeting attendance *<input inputMode="numeric" value={total} onChange={event => setTotal(event.target.value)} /></label><p className={styles.muted}>Includes you and everyone present.</p></> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {saved ? <p role="status">Report saved.</p> : null}
      <button type="button" className={styles.primary} disabled={busy || saved || readOnly} onClick={save}>{readOnly ? "This report is view only" : busy ? "Saving…" : saved ? "Report saved" : creating ? "Create meeting & save report" : "Save my attendance report"}</button>
      {onCancel ? <button type="button" className={styles.add} disabled={busy} onClick={onCancel}>Back to meetings</button> : null}
    </fieldset>
  </div>;
}
