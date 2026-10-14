"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { remindChurchMember } from "@/app/(site)/dashboard/church/actions";
import { DashboardIcon, StatusPill, type StatusTone } from "@/components/dashboard/v3/primitives";
import styles from "@/components/sogp/follow-up-invitations.module.css";

type Status = "reported" | "nil" | "missing";
export type OversightRow = { userId: string; name: string; roleLabel: string; group: string; statuses: Record<"devotional" | "ministry" | "meetings", Status> };
const tone: Record<Status, StatusTone> = { reported: "green", nil: "neutral", missing: "amber" };
const label: Record<Status, string> = { reported: "Reported", nil: "Nil", missing: "Missing" };
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");

function Remind({ subjectId, day }: { subjectId: string; day: string }) {
  const [pending, start] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  if (message) return <span className={styles.meta}>{message}</span>;
  return <button type="button" className={styles.copyRow} style={{ justifyContent: "flex-start", gap: 8 }} disabled={pending} onClick={() => start(async () => { try { const result = await remindChurchMember(subjectId, day); setMessage(result.ok ? result.sent ? "Reminder sent today" : "Already reminded today" : result.error); } catch { setMessage("Could not send the reminder."); } })}><DashboardIcon name="bell" size={16} />{pending ? "Sending…" : "Send reminder"}</button>;
}

/** Paper: Pleros-oversight. Status only: no notes, contacts or report text. */
export function ChurchOversight({ rows, day, dayLabel, scope, remindersEnabled }: { rows: OversightRow[]; day: string; dayLabel: string; scope: string; remindersEnabled: boolean }) {
  const needs = rows.filter(row => Object.values(row.statuses).includes("missing"));
  const [filter, setFilter] = useState<"needs" | "all">(needs.length ? "needs" : "all");
  const visible = filter === "needs" ? needs : rows;
  return <section className={styles.page}>
    <div className={styles.heading}><span className={styles.eyebrow}>Church oversight</span><h1>{scope}</h1><p>{rows.length} {rows.length === 1 ? "person" : "people"} in your scope</p></div>
    <div className={styles.panel}><div className={styles.sectionHead}><strong>Daily reports</strong><span className={styles.meta}>{dayLabel}</span></div>
      <div className={styles.statRow} style={{ padding: 0, background: "none" }}><div><strong>{rows.length - needs.length} / {rows.length}</strong><span className={styles.meta}>All categories reported</span></div><div><strong>{needs.length}</strong><span className={styles.meta}>Need a report</span></div></div></div>
    <div className={styles.tabs} role="tablist"><button type="button" role="tab" aria-selected={filter === "needs"} onClick={() => setFilter("needs")}>Needs a report · {needs.length}</button><button type="button" role="tab" aria-selected={filter === "all"} onClick={() => setFilter("all")}>View all {rows.length}</button></div>
    {visible.length ? <ul className={styles.list}>{visible.map(row => <li key={row.userId} className={styles.card} style={{ gap: 12, marginBottom: 12 }}>
      <Link className={styles.person} href={`/dashboard/church/${encodeURIComponent(row.userId)}?day=${day}`} style={{ color: "inherit", textDecoration: "none" }}><span className={styles.avatar}>{initials(row.name)}</span><span><strong>{row.name}</strong><span className={styles.meta} style={{ display: "block" }}>{row.roleLabel} · {row.group}</span></span></Link>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>{(["devotional", "ministry", "meetings"] as const).map(category => <span key={category} style={{ display: "grid", gap: 4, justifyItems: "start" }}><span className={styles.meta} style={{ textTransform: "capitalize" }}>{category}</span><StatusPill tone={tone[row.statuses[category]]}>{label[row.statuses[category]]}</StatusPill></span>)}</div>
      {remindersEnabled && Object.values(row.statuses).includes("missing") ? <Remind subjectId={row.userId} day={day} /> : null}
    </li>)}</ul> : <p className={styles.muted}>{filter === "needs" ? "Everyone in your scope has reported." : "No one is in your oversight scope yet."}</p>}
    <div className={styles.info}><p>Only reports in your assigned scope.</p></div>
  </section>;
}
