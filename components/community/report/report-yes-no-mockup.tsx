"use client";

import { useState, type ReactNode } from "react";
import { BookOpenIcon, CheckIcon, ChevronRightIcon, HandHeartIcon, HeartHandshakeIcon, PlusIcon, UsersRoundIcon } from "lucide-react";

import { ReportSheet, Segmented, Stepper, sheetStyles as sheet } from "./report-sheet";
import styles from "./daily-report-sections.module.css";

/**
 * Mockup (sample data, nothing saved) of My reports after the Pastor's 21
 * October review: Evangelism and Discipleship are answered Yes or No every
 * day (No needs a reason), and Meetings asks "Did you attend a meeting
 * today?". A teaching or prayer meeting asks whether you led it or attended;
 * leading one asks when it started and ended (the length is worked out) and
 * where, picked from venues used before.
 */

type Answer = { yes: true; detail: string } | { yes: false; reason: string } | null;
type MeetingKind = "teaching" | "prayer";
type Meeting = { kind: MeetingKind; led: boolean; detail: string };
type Popup = { part: "evangelism" | "discipleship" | "meetings"; answer: "yes" | "no" } | null;

const KIND_LABEL: Record<MeetingKind, string> = { teaching: "Teaching meeting", prayer: "Prayer meeting" };
/** Venues this person has used before, so they pick rather than type (sample). */
const PAST_VENUES = ["Church hall", "Online (Zoom)", "Yaba campus"];

const minutesOf = (time: string) => { const [h, m] = time.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };
/** Minutes from start to end; an end before the start runs past midnight (an overnight prayer meeting). */
const lengthOf = (start: string, end: string) => (minutesOf(end) - minutesOf(start) + 1440) % 1440;
const durationLabel = (minutes: number) => [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)} hr` : null, minutes % 60 ? `${minutes % 60} min` : null].filter(Boolean).join(" ");
const clock = (time: string) => { const [h = 0, m = 0] = time.split(":").map(Number); return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`; };
const SAMPLE_YES = { evangelism: "One-to-one: 3 people · 1 saved", discipleship: "2 people · taught, prayed together" };

function Pill({ ready, children }: { ready: boolean; children: ReactNode }) {
  return <span className={styles.pill} data-tone={ready ? "ready" : "todo"}>{children}</span>;
}

function Card({ icon, tone, title, ready, children }: { icon: ReactNode; tone: [string, string]; title: string; ready: boolean; children: ReactNode }) {
  return <section className={styles.card} aria-label={title}>
    <div className={styles.cardHead}>
      <span className={styles.icon} style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{icon}</span>
      <h2 className={styles.title}>{title}</h2>
      <Pill ready={ready}>{ready ? "Ready" : "Not filled"}</Pill>
    </div>
    {children}
  </section>;
}

/** No and Yes side by side; once answered, the row shows the answer and opens it again. */
function YesNo({ question, title, answer, onAnswer }: { question: string; title: string; answer: Answer; onAnswer: (yes: boolean) => void }) {
  if (answer) return <div className={styles.row}>
    <button type="button" className={styles.rowButton} onClick={() => onAnswer(answer.yes)}>
      <span className={styles.tick} data-on={answer.yes ? "" : undefined} aria-hidden="true">{answer.yes ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}: {answer.yes ? "Yes" : "No"}</span><span className={styles.rowDetail}>{answer.yes ? answer.detail : answer.reason}</span></span>
      <ChevronRightIcon className={styles.chev} aria-hidden="true" />
    </button>
  </div>;
  return <div className={styles.row}>
    <span className={styles.rowCopy} style={{ padding: "8px 0 8px 14px" }}><span className={styles.rowTitle}>{title}</span><span className={styles.rowDetail}>{question}</span></span>
    <span className="mr-3.5 flex shrink-0 gap-1.5" role="group" aria-label={question}>
      <button type="button" className={styles.quick} style={{ borderColor: "var(--color-line)", color: "var(--color-text-strong)" }} onClick={() => onAnswer(false)}>No</button>
      <button type="button" className={styles.quick} onClick={() => onAnswer(true)}>Yes</button>
    </span>
  </div>;
}

/** No asks why, and the reason is compulsory. */
function ReasonSheet({ title, examples, onSave, onClose }: { title: string; examples: string[]; onSave: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState("");
  return <ReportSheet title={title} subtitle="A short reason is needed to save." onClose={onClose}
    footer={close => <button type="button" className={sheet.primary} disabled={reason.trim().length < 3} onClick={() => { onSave(reason.trim()); close(); }}>Save</button>}>
    {() => <>
      <div className={sheet.chips}>{examples.map(example => <button key={example} type="button" className={sheet.chip} aria-pressed={reason === example} onClick={() => setReason(example)}>{example}</button>)}</div>
      <label className={sheet.field}><span className={sheet.label}>Reason</span>
        <textarea className={sheet.textarea} maxLength={300} value={reason} onChange={event => setReason(event.target.value)} placeholder="For example, it was Sunday and the focus was the service" />
      </label>
    </>}
  </ReportSheet>;
}

/** Yes opens the same pop-up as today; the mockup stands in for it. */
function TodaysSheet({ title, detail, onSave, onClose }: { title: string; detail: string; onSave: () => void; onClose: () => void }) {
  return <ReportSheet title={title} subtitle="Unchanged: the pop-up you fill today" onClose={onClose}
    footer={close => <button type="button" className={sheet.primary} onClick={() => { onSave(); close(); }}>Save</button>}>
    {() => <p className={sheet.muted}>In the app, this is the {title.toLowerCase()} pop-up as it is now. The mockup saves sample answers: “{detail}”.</p>}
  </ReportSheet>;
}

/** Pick a venue you've used before, or type a new one (remembered for next time). */
function VenuePicker({ value, onChange }: { value: string; onChange: (venue: string) => void }) {
  const [other, setOther] = useState(false);
  const typing = other || (value !== "" && !PAST_VENUES.includes(value));
  return <div className={sheet.field}><span className={sheet.label}>Venue</span>
    <div className={sheet.chips}>
      {PAST_VENUES.map(venue => <button key={venue} type="button" className={sheet.chip} aria-pressed={!typing && value === venue} onClick={() => { setOther(false); onChange(venue); }}>{venue}</button>)}
      <button type="button" className={`${sheet.chip} ${sheet.chipAdd}`} aria-pressed={typing} onClick={() => { setOther(true); onChange(""); }}><PlusIcon className="size-3.5" aria-hidden="true" />Somewhere else</button>
    </div>
    {typing ? <>
      <input className={sheet.input} maxLength={120} value={value} onChange={event => onChange(event.target.value)} placeholder="For example, Ikeja home cell" autoFocus />
      <span className={sheet.hint}>We’ll keep it, so next time you can just pick it.</span>
    </> : null}
  </div>;
}

function MeetingSheet({ onSave, onClose }: { onSave: (meeting: Meeting) => void; onClose: () => void }) {
  const [kind, setKind] = useState<MeetingKind | null>(null);
  const [role, setRole] = useState<"led" | "attended">("attended");
  const [brought, setBrought] = useState(0);
  const [emphasis, setEmphasis] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [venue, setVenue] = useState("");
  const [note, setNote] = useState("");

  if (!kind) return <ReportSheet title="Which meeting?" onClose={onClose}>
    {() => <div className="grid gap-2.5">
      {([["teaching", BookOpenIcon, "#e4ebfd", "#2331ae", "A Bible study, class or teaching"], ["prayer", HandHeartIcon, "#f6d9de", "#7a2e45", "A prayer meeting or vigil"]] as const).map(([key, Icon, bg, fg, text]) =>
        <button key={key} type="button" className={sheet.kind} onClick={() => setKind(key)}>
          <span className={sheet.kindIcon} style={{ background: bg, color: fg }} aria-hidden="true"><Icon className="size-5" strokeWidth={2} /></span>
          <span><h3>{KIND_LABEL[key]}</h3><p>{text}</p></span>
        </button>)}
    </div>}
  </ReportSheet>;

  const led = role === "led";
  const timed = Boolean(from && to && from !== to);
  const minutes = timed ? lengthOf(from, to) : 0;
  const overnight = timed && minutesOf(to) < minutesOf(from);
  const complete = !led || (timed && venue.trim().length > 1 && (kind === "prayer" || emphasis.trim().length > 1));
  const detail = led
    ? [kind === "teaching" ? emphasis.trim() : null, timed ? `${clock(from)} to ${clock(to)} (${durationLabel(minutes)})` : null, venue.trim()].filter(Boolean).join(" · ")
    : `Attended${brought ? ` · brought ${brought === 1 ? "1 person" : `${brought} people`}` : ""}`;
  return <ReportSheet title={KIND_LABEL[kind]} back="Which meeting?" onBack={() => setKind(null)} onClose={onClose}
    footer={close => <button type="button" className={sheet.primary} disabled={!complete} onClick={() => { onSave({ kind, led, detail }); close(); }}>Save</button>}>
    {() => <>
      <Segmented label="Your part" options={[{ key: "attended", label: "I attended" }, { key: "led", label: "I led it" }]} value={role} onChange={setRole} />
      {led ? <>
        {kind === "teaching" ? <label className={sheet.field}><span className={sheet.label}>Teaching emphasis</span>
          <input className={sheet.input} maxLength={160} value={emphasis} onChange={event => setEmphasis(event.target.value)} placeholder="For example, Faith that works" />
        </label> : null}
        <div className={sheet.field}>
          <div className="flex gap-2.5">
            <label className={sheet.field} style={{ flex: 1 }}><span className={sheet.label}>Started</span><input type="time" className={sheet.input} value={from} onChange={event => setFrom(event.target.value)} /></label>
            <label className={sheet.field} style={{ flex: 1 }}><span className={sheet.label}>Ended</span><input type="time" className={sheet.input} value={to} onChange={event => setTo(event.target.value)} /></label>
          </div>
          <span className={sheet.hint} aria-live="polite">{timed ? `${durationLabel(minutes)}${overnight ? ", ending the next day" : ""}` : "The length is worked out from these."}</span>
        </div>
        <VenuePicker value={venue} onChange={setVenue} />
      </> : <div className={sheet.field}><span className={sheet.label}>People you brought</span>
        <Stepper label="People you brought" value={brought} onChange={setBrought} max={50} unit={["person", "people"]} />
      </div>}
      <label className={sheet.field}><span className={sheet.label}>Note <em>Optional</em></span>
        <textarea className={sheet.textarea} maxLength={500} value={note} onChange={event => setNote(event.target.value)} />
      </label>
    </>}
  </ReportSheet>;
}

export function ReportYesNoMockup() {
  const [evangelism, setEvangelism] = useState<Answer>(null);
  const [discipleship, setDiscipleship] = useState<Answer>(null);
  const [attended, setAttended] = useState<Answer>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [popup, setPopup] = useState<Popup>(null);
  const [adding, setAdding] = useState(false);
  const close = () => setPopup(null);

  return <div className={styles.page}>
    <header className={styles.dayHeader}><div><h1>My reports</h1><p className={styles.meta}>Wednesday, 21 October</p></div></header>

    <Card icon={<BookOpenIcon className="size-4" strokeWidth={2} />} tone={["#e4ebfd", "#2331ae"]} title="Devotion" ready>
      <div className={styles.row}><span className={styles.rowCopy} style={{ padding: "8px 14px" }}><span className={styles.rowTitle}>Unchanged</span><span className={styles.rowDetail}>Bible reading, Prayer Watch and Teaching as they are now</span></span></div>
    </Card>

    <Card icon={<HeartHandshakeIcon className="size-4" strokeWidth={2} />} tone={["#dcefe3", "#1f6b45"]} title="Ministry" ready={Boolean(evangelism && discipleship)}>
      <YesNo title="Evangelism" question="Did you do any evangelism today?" answer={evangelism} onAnswer={yes => setPopup({ part: "evangelism", answer: yes ? "yes" : "no" })} />
      <YesNo title="Discipleship" question="Did you disciple anyone today?" answer={discipleship} onAnswer={yes => setPopup({ part: "discipleship", answer: yes ? "yes" : "no" })} />
    </Card>

    <Card icon={<UsersRoundIcon className="size-4" strokeWidth={2} />} tone={["#f6d9de", "#7a2e45"]} title="Meetings" ready={Boolean(attended && (!attended.yes || meetings.length))}>
      {attended?.yes && meetings.length ? <>
        {meetings.map((meeting, index) => <div key={index} className={styles.row}>
          <span className={styles.rowCopy} style={{ padding: "8px 14px" }}>
            <span className={styles.rowTitle}>{KIND_LABEL[meeting.kind]}{meeting.led ? " · you led it" : " · you attended"}</span>
            <span className={styles.rowDetail}>{meeting.detail}</span>
          </span>
        </div>)}
        <div className={styles.row}><button type="button" className={styles.rowButton} onClick={() => setAdding(true)}>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>Add another meeting</span><span className={styles.rowDetail}>Teaching or prayer</span></span>
          <span className={styles.add} aria-hidden="true"><PlusIcon className="size-4" />Add</span>
        </button></div>
      </> : <YesNo title={attended ? "Attended a meeting" : "Did you attend a meeting today?"} question="Teaching or prayer" answer={attended} onAnswer={yes => yes ? setAdding(true) : setPopup({ part: "meetings", answer: "no" })} />}
    </Card>

    <p className={styles.meta}>Mockup: answers here aren’t saved. “Nothing today” goes: every part is answered Yes or No.</p>

    {popup?.answer === "no" ? <ReasonSheet
      title={popup.part === "evangelism" ? "Why no evangelism today?" : popup.part === "discipleship" ? "Why no discipleship today?" : "Why no meeting today?"}
      examples={popup.part === "meetings" ? ["There was no meeting today", "I couldn’t attend"] : ["It was Sunday; the focus was the service", "I was unwell", "I was travelling"]}
      onSave={reason => (popup.part === "evangelism" ? setEvangelism : popup.part === "discipleship" ? setDiscipleship : setAttended)({ yes: false, reason })}
      onClose={close} /> : null}
    {popup?.answer === "yes" && popup.part !== "meetings" ? <TodaysSheet title={popup.part === "evangelism" ? "Evangelism" : "Discipleship"} detail={SAMPLE_YES[popup.part]}
      onSave={() => (popup.part === "evangelism" ? setEvangelism : setDiscipleship)({ yes: true, detail: SAMPLE_YES[popup.part as "evangelism" | "discipleship"] })} onClose={close} /> : null}
    {adding ? <MeetingSheet onClose={() => setAdding(false)}
      onSave={meeting => { setMeetings(list => [...list, meeting]); setAttended({ yes: true, detail: "" }); }} /> : null}
  </div>;
}
