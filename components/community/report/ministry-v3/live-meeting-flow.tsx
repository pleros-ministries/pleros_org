"use client";
import { Component, Suspense, useRef, useState, type ReactNode } from "react";
import { QueryErrorResetBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import { reportableDateKeys } from "@/lib/community/ministry-report";
import { createPrivateContactAction, createSharedMeetingAction, saveSharedAttendanceAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import { MeetingReportForm, type SharedMeetingView } from "./meeting-form";
import { MeetingChooser } from "./meeting-chooser";
import { ReportDateLine } from "./report-date";
import styles from "./ministry-form.module.css";

class MeetingBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() { return this.state.error ? <div role="alert"><p>{this.state.error.message === "Access denied" ? "Your church-unit assignment has changed. Refresh to check your access." : "Meetings could not be loaded."}</p><button type="button" className={styles.add} onClick={this.props.onRetry}>Try again</button></div> : this.props.children; }
}
type Report = { activityId: number; attended: boolean; participation: "leader" | "worker" | "disciple" };
type MeetingChoice = SharedMeetingView & { ownReport: Report | null };
function MeetingList({ unitId, day, onChoose, initialData }: { unitId: number; day: string; onChoose: (meeting: MeetingChoice) => void; initialData?: MeetingChoice[] }) {
  const { data, error, refetch } = useSuspenseQuery({ queryKey: ["shared-church-meetings", unitId, day], initialData, refetchInterval: 15000, retry: (count, error) => error.message !== "Access denied" && count < 2, queryFn: async (): Promise<MeetingChoice[]> => {
    const response = await fetch(`/api/dashboard/shared-meetings?unit=${unitId}&day=${encodeURIComponent(day)}`, { cache: "no-store" });
    if (!response.ok) throw new Error(response.status === 403 ? "Access denied" : "Meetings could not be loaded.");
    return response.json();
  } });
  if (error) throw error;
  return <MeetingChooser meetings={data} onChoose={onChoose} onRefresh={() => { void refetch(); }} />;
}
export function LiveMeetingFlow({ dateKey, today, units, contacts, initial, readOnly = false, initialMeetings, embedded = false, onSaved }: {
  /** Inside the one-page report: no date line or big title; saving refreshes the page in place. */
  embedded?: boolean; onSaved?: () => void;
  dateKey: string; today: string; units: { id: number; name: string; branchId: number }[]; contacts: MinistryContact[];
  initial?: { meeting: SharedMeetingView; report: Report; contacts: MinistryContact[] }; readOnly?: boolean;
  initialMeetings?: MeetingChoice[];
}) {
  const router = useRouter(), requestKey = useRef<string | null>(null);
  const [unitId, setUnitId] = useState(initial?.meeting.unitId ?? units[0]?.id ?? null), [day, setDay] = useState(dateKey), [mode, setMode] = useState<"select" | "create" | "attendance">(initial ? "attendance" : "select"), [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<(SharedMeetingView & { ownReport: Report | null }) | null>(initial ? { ...initial.meeting, ownReport: initial.report } : null);
  const [chosenContacts, setChosenContacts] = useState(initial?.contacts ?? []);
  if (!units.length && !initial) return <section className={styles.form}><h1>Meeting reports</h1><p role="status">No church unit is assigned to you. Shared meetings require an explicit church assignment; community or SOGP membership does not grant access.</p></section>;
  return <div>
    {mode === "select" && unitId !== null ? <section className={styles.form}>
      {embedded ? <p className={styles.muted}>Choose a meeting the leader created, or create one if you led it.</p> : <>
      <ReportDateLine dateKey={day} today={today} days={reportableDateKeys(today)} onChange={value => { setDay(value); setSelected(null); }} />
      <div className={styles.titleBlock}><h1>Choose a meeting</h1><p className={styles.muted}>For workers and disciples. Choose a meeting created by the person who led it.</p></div>
      </>}
      {units.length > 1 ? <label className={styles.field}>Church unit<select value={unitId ?? ""} onChange={event => { setUnitId(Number(event.target.value)); setSelected(null); }}>{units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label> : null}
      <QueryErrorResetBoundary>{({ reset }) => <MeetingBoundary key={attempt} onRetry={() => { reset(); setAttempt(value => value + 1); }}><Suspense fallback={<p role="status">Loading meetings…</p>}><MeetingList unitId={unitId} day={day} initialData={unitId === units[0]?.id && day === dateKey ? initialMeetings : undefined} onChoose={row => {
        if (row.ownReport) { router.push(`/dashboard/community/report/${row.ownReport.activityId}`); return; }
        setSelected(row); setChosenContacts([]); setMode("attendance");
      }} /></Suspense></MeetingBoundary>}</QueryErrorResetBoundary>
      <div className={styles.footer}><button type="button" className={styles.secondaryWide} onClick={() => { requestKey.current = null; setMode("create"); }}>I led a meeting · Create it</button></div>
    </section> : <MeetingReportForm key={`${mode}:${selected?.id ?? "new"}`} creating={mode === "create"} dateKey={day} meeting={selected ?? undefined} contacts={contacts} selectedContacts={chosenContacts} initialReport={selected?.ownReport ?? undefined} readOnly={readOnly || Boolean(initial && !units.some(unit => unit.id === initial.meeting.unitId))} onCreateContact={createPrivateContactAction} onCancel={!initial ? () => setMode("select") : undefined} onSave={async payload => {
      const result = mode === "create" ? await createSharedMeetingAction({ ...payload, dateKey: day, unitId, requestKey: requestKey.current ??= crypto.randomUUID() }) : await saveSharedAttendanceAction({ meetingId: selected?.id, participation: payload.participation ?? "worker", attended: payload.attended, contacts: payload.contacts });
      if (!result.ok) return result;
      if (embedded) { router.refresh(); setMode("select"); setSelected(null); onSaved?.(); return { ok: true }; }
      router.push(`/dashboard/community/report?day=${encodeURIComponent(day)}`); router.refresh(); return { ok: true };
    }} />}
  </div>;
}
