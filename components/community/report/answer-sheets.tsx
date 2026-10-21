"use client";

import { useState } from "react";
import { BookOpenIcon, ChevronRightIcon, HandHeartIcon, MegaphoneIcon, PlusIcon } from "lucide-react";

import {
  ATTENDANCE_MAX, BROUGHT_MAX, EMPHASIS_MAX, MEETING_LABEL, MEETING_NOTE_MAX, NO_REASON_MAX, NO_REASON_MIN, VENUE_MAX,
  durationLabel, meetingLine, meetingMinutes, type MeetingKind, type NoPart,
} from "@/lib/community/meeting-report";

import { ReportSheet, Segmented, Stepper, sheetStyles as sheet } from "./report-sheet";
import styles from "./daily-report-sections.module.css";

/**
 * My reports answered Yes or No (Pastor, 21 October): the row, the reason a
 * No needs, and the meeting pop-up. The sheets hand their answer to the page,
 * which shows it at once and rolls it back with a message if the save fails.
 */

/** No and Yes side by side, before the part is answered. */
export function YesNoRow({ title, question, disabled, onNo, onYes }: { title: string; question: string; disabled?: boolean; onNo: () => void; onYes: () => void }) {
  return <div className={styles.row}>
    <span className={styles.rowCopy} style={{ padding: "8px 0 8px 14px" }}><span className={styles.rowTitle}>{title}</span><span className={styles.rowDetail}>{question}</span></span>
    <span className="mr-3.5 flex shrink-0 gap-1.5" role="group" aria-label={title}>
      <button type="button" className={styles.quick} style={{ borderColor: "var(--color-line)", color: "var(--color-text-strong)" }} disabled={disabled} onClick={onNo}>No</button>
      <button type="button" className={styles.quick} disabled={disabled} onClick={onYes}>Yes</button>
    </span>
  </div>;
}

/** An answered No: the reason, and a tap to change it. */
export function NoRow({ title, reason, onOpen }: { title: string; reason: string; onOpen?: () => void }) {
  return <div className={styles.row}>
    <button type="button" className={styles.rowButton} onClick={onOpen} disabled={!onOpen}>
      <span className={styles.tick} aria-hidden="true" />
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}: No</span><span className={styles.rowDetail}>{reason}</span></span>
      {onOpen ? <ChevronRightIcon className={styles.chev} aria-hidden="true" /> : null}
    </button>
  </div>;
}

const NO_TITLES: Record<NoPart, string> = { evangelism: "Why no evangelism today?", discipleship: "Why no discipleship today?", meetings: "Why no meeting today?" };
const NO_EXAMPLES: Record<NoPart, string[]> = {
  evangelism: ["It was Sunday; the focus was the service", "I was unwell", "I was travelling"],
  discipleship: ["It was Sunday; the focus was the service", "I was unwell", "I was travelling"],
  meetings: ["There was no meeting today", "I couldn’t attend"],
};

/** A No needs a reason. `onYes` takes the No back and opens the Yes pop-up instead. */
export function ReasonSheet({ part, initial, onSave, onYes, onClose }: {
  part: NoPart; initial?: string;
  onSave: (reason: string) => void;
  onYes?: () => void; onClose: () => void;
}) {
  const [reason, setReason] = useState(initial ?? "");
  const ready = reason.trim().length >= NO_REASON_MIN;
  return <ReportSheet title={NO_TITLES[part]} subtitle="A short reason is needed to save." onClose={onClose}
    footer={close => <button type="button" className={sheet.primary} disabled={!ready} onClick={() => { onSave(reason.trim()); close(); }}>Save</button>}>
    {() => <>
      <div className={sheet.chips}>{NO_EXAMPLES[part].map(example => <button key={example} type="button" className={sheet.chip} aria-pressed={reason === example} onClick={() => setReason(example)}>{example}</button>)}</div>
      <label className={sheet.field}><span className={sheet.label}>Reason</span>
        <textarea className={sheet.textarea} maxLength={NO_REASON_MAX} value={reason} onChange={event => setReason(event.target.value)} placeholder="For example, it was Sunday and the focus was the service" />
      </label>
      {onYes ? <button type="button" className={sheet.quiet} style={{ justifySelf: "start" }} onClick={onYes}>Change to Yes</button> : null}
    </>}
  </ReportSheet>;
}

/** Pick a venue used before, or type one; someone who has never entered one just types. */
function VenuePicker({ venues, value, onChange }: { venues: string[]; value: string; onChange: (venue: string) => void }) {
  const [other, setOther] = useState(false);
  const typing = !venues.length || other || (value !== "" && !venues.includes(value));
  return <div className={sheet.field}><span className={sheet.label}>Venue</span>
    {venues.length ? <div className={sheet.chips}>
      {venues.map(venue => <button key={venue} type="button" className={sheet.chip} aria-pressed={!typing && value === venue} onClick={() => { setOther(false); onChange(venue); }}>{venue}</button>)}
      <button type="button" className={`${sheet.chip} ${sheet.chipAdd}`} aria-pressed={typing && venues.length > 0} onClick={() => { setOther(true); onChange(""); }}><PlusIcon className="size-3.5" aria-hidden="true" />Somewhere else</button>
    </div> : null}
    {typing ? <input className={sheet.input} maxLength={VENUE_MAX} value={value} onChange={event => onChange(event.target.value)} placeholder="For example, church hall or online" aria-label="Venue" /> : null}
  </div>;
}

const digits = (text: string) => text.replace(/\D/g, "").slice(0, String(ATTENDANCE_MAX).length);
const KIND_CHOICES = [
  ["teaching", BookOpenIcon, "#e4ebfd", "#2331ae", "A Bible study, class or teaching"],
  ["prayer", HandHeartIcon, "#f6d9de", "#7a2e45", "A prayer meeting or vigil"],
  ["outreach", MegaphoneIcon, "#dcefe3", "#1f6b45", "Taken from your Evangelism and Discipleship today"],
] as const;

/** A teaching or prayer meeting you led or attended, or an outreach meeting drawn from your ministry. */
export type MeetingDraft = { meeting: Record<string, unknown>; kind: MeetingKind; led: boolean; summary: string };

export function MeetingSheet({ venues, ministry, onSave, onClose }: {
  venues: string[];
  /** The day's evangelism and discipleship in a line; null when there's none. */
  ministry: string | null;
  onSave: (draft: MeetingDraft) => void;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<MeetingKind | null>(null);
  const [role, setRole] = useState<"led" | "attended">("attended");
  const [brought, setBrought] = useState(0);
  const [emphasis, setEmphasis] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [venue, setVenue] = useState("");
  const [workers, setWorkers] = useState("");
  const [members, setMembers] = useState("");
  const [note, setNote] = useState("");

  if (!kind) return <ReportSheet title="Which meeting?" onClose={onClose}>
    {() => <div className="grid gap-2.5">
      {KIND_CHOICES.map(([key, Icon, bg, fg, text]) => <button key={key} type="button" className={sheet.kind} onClick={() => setKind(key)}>
        <span className={sheet.kindIcon} style={{ background: bg, color: fg }} aria-hidden="true"><Icon className="size-5" strokeWidth={2} /></span>
        <span><h3>{MEETING_LABEL[key]}</h3><p>{text}</p></span>
      </button>)}
    </div>}
  </ReportSheet>;

  const led = kind !== "outreach" && role === "led";
  const timed = Boolean(from && to && from !== to);
  const total = Number(workers || 0) + Number(members || 0);
  const complete = kind === "outreach" ? Boolean(ministry)
    : !led || (timed && venue.trim().length > 1 && total > 0 && (kind === "prayer" || emphasis.trim().length > 1));
  const save = (close: () => void) => {
    const meeting = kind === "outreach" ? { kind } : led
      ? { kind, role, emphasis, startsAt: from, endsAt: to, venue, workers: Number(workers || 0), members: Number(members || 0), note }
      : { kind, role, brought, note };
    const summary = kind === "outreach" ? ministry ?? "" : meetingLine(led
      ? { role: "led", emphasis: kind === "teaching" ? emphasis.trim() : null, startsAt: from, endsAt: to, venue: venue.trim(), workers: Number(workers || 0), members: Number(members || 0), brought: 0 }
      : { role: "attended", emphasis: null, startsAt: null, endsAt: null, venue: null, workers: null, members: null, brought });
    onSave({ meeting, kind, led, summary });
    close();
  };

  return <ReportSheet title={MEETING_LABEL[kind]} back="Which meeting?" onBack={() => setKind(null)} onClose={onClose}
    footer={close => <button type="button" className={sheet.primary} disabled={!complete} onClick={() => save(close)}>Save</button>}>
    {() => kind === "outreach" ? <>
      {ministry ? <>
        <p className={sheet.muted}>From what you reported in Ministry today:</p>
        <div className={sheet.box}><div className={sheet.line}><span className={sheet.lineCopy}><span className={sheet.lineTitle}>Your ministry today</span><span className={sheet.lineMeta} style={{ whiteSpace: "normal" }}>{ministry}</span></span></div></div>
      </> : <p className={sheet.muted}>Answer Yes to Evangelism or Discipleship first and fill it in. An outreach meeting is drawn from them.</p>}
    </> : <>
      <Segmented label="Your part" options={[{ key: "attended", label: "I attended" }, { key: "led", label: "I led it" }]} value={role} onChange={setRole} />
      {led ? <>
        {kind === "teaching" ? <label className={sheet.field}><span className={sheet.label}>Teaching emphasis</span>
          <input className={sheet.input} maxLength={EMPHASIS_MAX} value={emphasis} onChange={event => setEmphasis(event.target.value)} placeholder="For example, Faith that works" />
        </label> : null}
        <div className={sheet.field}>
          <div className="flex gap-2.5">
            <label className={sheet.field} style={{ flex: 1 }}><span className={sheet.label}>Started</span><input type="time" className={sheet.input} value={from} onChange={event => setFrom(event.target.value)} /></label>
            <label className={sheet.field} style={{ flex: 1 }}><span className={sheet.label}>Ended</span><input type="time" className={sheet.input} value={to} onChange={event => setTo(event.target.value)} /></label>
          </div>
          {timed ? <span className={sheet.hint} aria-live="polite">{durationLabel(meetingMinutes(from, to))}{to < from ? ", ending the next day" : ""}</span> : null}
        </div>
        <VenuePicker venues={venues} value={venue} onChange={setVenue} />
        <div className={sheet.field}><span className={sheet.label}>Who was there?</span>
          <div className="flex gap-2.5">
            <label className={sheet.field} style={{ flex: 1 }}><span className={sheet.hint}>Workers</span><input className={sheet.input} inputMode="numeric" value={workers} onChange={event => setWorkers(digits(event.target.value))} placeholder="0" /></label>
            <label className={sheet.field} style={{ flex: 1 }}><span className={sheet.hint}>Members</span><input className={sheet.input} inputMode="numeric" value={members} onChange={event => setMembers(digits(event.target.value))} placeholder="0" /></label>
          </div>
          {total ? <span className={sheet.hint} aria-live="polite">{total === 1 ? "1 person" : `${total} people`} in all</span> : null}
        </div>
      </> : <div className={sheet.field}><span className={sheet.label}>People you brought</span>
        <Stepper label="People you brought" value={brought} onChange={setBrought} max={BROUGHT_MAX} unit={["person", "people"]} />
      </div>}
      <label className={sheet.field}><span className={sheet.label}>Note <em>Optional</em></span>
        <textarea className={sheet.textarea} maxLength={MEETING_NOTE_MAX} value={note} onChange={event => setNote(event.target.value)} />
      </label>
    </>}
  </ReportSheet>;
}
