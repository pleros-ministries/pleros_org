"use client";

import { useState } from "react";
import { CheckIcon, PlayIcon } from "lucide-react";

import { ReportSheet, sheetStyles as sheet } from "@/components/community/report/report-sheet";
import styles from "@/components/community/discipleship/discipleship-group.module.css";

/**
 * Mockup (sample data, nothing sent) of "Do you have a question? Ask a
 * question" after every teaching (Pastor, 21 October). It opens when the
 * teaching is finished: the lesson's audio reaches 90%, a podcast episode
 * ends, or Teaching is ticked on Home. With a leader the question goes to
 * them privately; without one it goes to Ask Pleros, asked anonymously or
 * with your name. "Not now" closes it for that teaching only.
 */
export function AskAfterTeachingMockup({ leader }: { leader: string | null }) {
  const [progress, setProgress] = useState(62);
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState<"sent" | "later" | null>(null);
  const [body, setBody] = useState("");
  // Ask Pleros needs the choice made each time, so nothing is preselected.
  const [as, setAs] = useState<"anonymous" | "named" | null>(null);
  const finished = progress >= 90;

  return <div className={styles.page}>
    <div><h1>Biblical Origin and Ontology</h1><p className={styles.sub}>Level 2 · Track 10</p></div>

    {/* Stand-in for the lesson's audio player. */}
    <div className={`${styles.panel} grid gap-3 p-4`}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-community-blue)] text-white" aria-hidden="true">{finished ? <CheckIcon className="size-5" strokeWidth={2.4} /> : <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} />}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Teaching audio</span><span className={styles.rowMeta}>{finished ? "Listened" : `${progress}% listened`}</span></span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#e9edf5]" aria-hidden="true"><i className="block h-full rounded-full bg-[var(--color-community-blue)]" style={{ width: `${progress}%` }} /></div>
      {!finished ? <button type="button" className={`${styles.btn} justify-self-start`} onClick={() => { setProgress(91); setOpen(true); }}>Mockup: finish the teaching</button> : null}
    </div>

    {asked === "sent" ? <p className={`${styles.panel} ${styles.empty}`}>{leader ? `Sent to ${leader}. Their reply shows in your group.` : "Sent to Pleros. The reply shows in Ask Pleros."}</p> : null}
    {asked === "later" ? <p className={styles.note}>Closed for this teaching. You can still ask from the lesson page any time.</p> : null}

    {open ? <ReportSheet title="Do you have a question?" subtitle="About Biblical Origin and Ontology" onClose={() => { setOpen(false); if (!asked) setAsked("later"); }}
      footer={close => <>
        <button type="button" className={sheet.quiet} onClick={() => { setAsked("later"); close(); }}>Not now</button>
        <button type="button" className={`${sheet.primary} ${sheet.fit}`} disabled={body.trim().length < 3 || (!leader && !as)} onClick={() => { setAsked("sent"); setBody(""); close(); }}>{leader ? `Send to ${leader}` : "Send to Pleros"}</button>
      </>}>
      {() => <>
        <label className={sheet.field}><span className={sheet.label}>Your question</span>
          <textarea className={sheet.textarea} rows={4} maxLength={2000} value={body} onChange={event => setBody(event.target.value)} placeholder="What would you like to ask about this teaching?" autoFocus />
        </label>
        {leader ? <p className={sheet.hint}>Only you and {leader} see it.</p> : <>
          <div className={sheet.field}><span className={sheet.label}>How to ask</span>
            <div className={sheet.chips} role="group" aria-label="How to ask">
              <button type="button" className={sheet.chip} aria-pressed={as === "anonymous"} onClick={() => setAs("anonymous")}>Ask anonymously</button>
              <button type="button" className={sheet.chip} aria-pressed={as === "named"} onClick={() => setAs("named")}>Show my name</button>
            </div>
          </div>
          <p className={sheet.hint}>{as === "anonymous" ? "The Pleros team won’t see who asked." : as === "named" ? "The Pleros team will see your name." : "Choose one to send."}</p>
        </>}
      </>}
    </ReportSheet> : null}
  </div>;
}
