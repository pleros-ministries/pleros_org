"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { BellIcon, ChevronRightIcon } from "lucide-react";

import { remindChurchMember } from "@/app/(site)/dashboard/church/actions";
import styles from "@/components/community/discipleship/discipleship-group.module.css";

import { ChurchHeading, ChurchPage } from "./church-ui";
import { Mark, short, Strip } from "./oversight-view";

type Status = "reported" | "nil" | "missing";
export type OversightRow = { userId: string; name: string; roleLabel: string; group: string; statuses: Record<"devotional" | "ministry" | "meetings", Status> };
const tone: Record<Status, string | undefined> = { reported: "ok", nil: undefined, missing: "risk" };
const CATEGORIES = [["devotional", "Devotion"], ["ministry", "Ministry"], ["meetings", "Meetings"]] as const;

function Remind({ subjectId, day }: { subjectId: string; day: string }) {
  const [pending, start] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  if (message) return <span className={styles.rowMeta}>{message}</span>;
  return <button type="button" className={styles.btn} disabled={pending} onClick={() => start(async () => { try { const result = await remindChurchMember(subjectId, day); setMessage(result.ok ? result.sent ? "Reminder sent today" : "Already reminded today" : result.error); } catch { setMessage("Could not send the reminder."); } })}>
    <BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />{pending ? "Sending…" : "Remind"}
  </button>;
}

/** Church reports (Paper: Pleros-oversight), in the Oversight style. Status only: no notes, contacts or report text. */
export function ChurchOversight({ rows, day, dayLabel, scope, remindersEnabled, header, note = "Only people in your assigned scope. You see whether each category was reported, never the report text." }: { rows: OversightRow[]; day: string; dayLabel: string; scope: string; remindersEnabled: boolean;
  /** Inside Oversight: its shared header replaces this page's own heading. */
  header?: React.ReactNode; note?: string }) {
  const needs = rows.filter(row => Object.values(row.statuses).includes("missing"));
  const [filter, setFilter] = useState<"needs" | "all">(needs.length ? "needs" : "all");
  const visible = filter === "needs" ? needs : rows;
  const tab = "inline-flex h-8 items-center justify-center rounded-[7px] text-[13px] font-medium transition-colors";
  return <ChurchPage bare={Boolean(header)}>
    {header ?? <ChurchHeading title="Church reports" sub={`${scope} · ${dayLabel}`} />}
    <Strip items={[["Reported", rows.length ? `${rows.length - needs.length}/${rows.length}` : "–"], ["Need a report", needs.length, needs.length > 0], ["People", rows.length]]} />
    <div className="grid grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]" role="tablist" aria-label="Show">
      {([["needs", `Needs a report · ${needs.length}`], ["all", `Everyone · ${rows.length}`]] as const).map(([key, text]) => <button key={key} type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
        className={`${tab} ${filter === key ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>{text}</button>)}
    </div>
    {visible.length ? <div className={styles.panel}><ul className={styles.list}>{visible.map((row, index) => {
      const missing = Object.values(row.statuses).includes("missing");
      return <li key={row.userId}><div className={`${styles.row} items-start`}>
        <Mark text={short(row.name)} index={index} />
        <span className={`${styles.rowCopy} gap-1.5`}>
          <Link href={`/dashboard/church/${encodeURIComponent(row.userId)}?day=${day}`} className="grid min-w-0 text-inherit no-underline">
            <span className={styles.rowTitle}>{row.name}</span>
            <span className={styles.rowMeta}>{row.roleLabel} · {row.group}</span>
          </Link>
          <span className="flex flex-wrap gap-1">{CATEGORIES.map(([key, label]) => <span key={key} className={styles.pill} data-tone={tone[row.statuses[key]]}>
            {label}{row.statuses[key] === "reported" ? " ✓" : row.statuses[key] === "nil" ? " · nil" : " · missing"}
          </span>)}</span>
        </span>
        {remindersEnabled && missing ? <Remind subjectId={row.userId} day={day} /> : <Link href={`/dashboard/church/${encodeURIComponent(row.userId)}?day=${day}`} aria-label={`Open ${row.name}’s report`}><ChevronRightIcon className={`${styles.chev} mt-3 size-4`} strokeWidth={2} /></Link>}
      </div></li>;
    })}</ul></div> : <p className={`${styles.panel} ${styles.empty}`}>{filter === "needs" ? "Everyone in your scope has reported." : "No one is in your oversight scope yet."}</p>}
    <p className={styles.note}>{note}</p>
  </ChurchPage>;
}
