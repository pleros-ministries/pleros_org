"use client";
import { useState } from "react";
import { shiftDate } from "@/lib/sogp/daily-date";
import styles from "./ministry-form.module.css";

const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (dateKey: string) => { const date = new Date(`${dateKey}T00:00:00Z`); return `${weekday.format(date)}, ${dayMonth.format(date)}`; };
function chipLabel(dateKey: string, today?: string) {
  return today && dateKey === today ? "Today" : today && dateKey === shiftDate(today, -1) ? "Yesterday" : fmt(dateKey);
}
export function reportDayLabel(dateKey: string, today?: string) {
  const relative = today ? dateKey === today ? "Today" : dateKey === shiftDate(today, -1) ? "Yesterday" : null : null;
  return relative ? `${relative} · ${fmt(dateKey)}` : fmt(dateKey);
}

/** Paper: "Today · Tue, 13 Oct" with an inline Change date control over the write window. */
export function ReportDateLine({ dateKey, today, days, onChange }: { dateKey: string; today?: string; days?: string[]; onChange?: (dateKey: string) => void }) {
  const [open, setOpen] = useState(false);
  const canChange = Boolean(onChange && days && days.length > 1);
  return <div className={styles.dateLine}>
    <div className={styles.dateRow}><span className={styles.muted}>{reportDayLabel(dateKey, today)}</span>
      {canChange ? <button type="button" className={styles.textButton} aria-expanded={open} onClick={() => setOpen(value => !value)}>Change date</button> : null}</div>
    {open && canChange ? <div className={styles.dayChoices} role="group" aria-label="Report day">{days!.map(day => <button key={day} type="button" aria-pressed={day === dateKey} onClick={() => { onChange!(day); setOpen(false); }}>{chipLabel(day, today)}</button>)}</div> : null}
  </div>;
}
