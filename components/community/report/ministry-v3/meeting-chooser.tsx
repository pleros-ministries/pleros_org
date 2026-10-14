"use client";
import { useState } from "react";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import { meetingDateLong, meetingTimes, type SharedMeetingView } from "./meeting-form";
import styles from "./ministry-form.module.css";

/** Paper: Pleros-report-meeting-select / -meeting-missing. Selection only; never creates a meeting or request. */
export function MeetingChooser<T extends SharedMeetingView>({ meetings, onChoose, onRefresh }: {
  meetings: T[]; onChoose: (meeting: T) => void; onRefresh?: () => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle ? meetings.filter(row => `${row.subject ?? "Prayer meeting"} ${row.venue ?? ""} ${row.creatorName ?? ""}`.toLowerCase().includes(needle)) : meetings;
  return <>
    <label className={styles.search}><span className={styles.srOnly}>Search meetings or venues</span><DashboardIcon name="search" size={20} /><input type="search" placeholder="Search meetings or venues" value={query} onChange={event => setQuery(event.target.value)} />{query ? <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => setQuery("")}><DashboardIcon name="close" size={16} /></button> : null}</label>
    {visible.length ? <section className={styles.section}>
      <div className={styles.sectionHeader}><h2>Existing meetings</h2><span className={styles.muted}>{visible.length} {visible.length === 1 ? "meeting" : "meetings"}</span></div>
      <ul className={styles.meetingList}>{visible.map(row => <li key={row.id}><button type="button" className={styles.meetingCard} onClick={() => onChoose(row)}>
        <StatusPill tone={row.kind === "teaching_meeting" ? "lilac" : "blue"}>{row.kind === "teaching_meeting" ? "Teaching" : "Prayer"}</StatusPill>
        <span className={styles.meetingTitle}><span>{row.subject ?? "Prayer meeting"}</span><DashboardIcon name="right" size={16} /></span>
        <span className={styles.meetingMeta}><DashboardIcon name="calendar" size={16} />{meetingDateLong(row.meetingDate)}</span>
        {row.startsAt && row.endsAt ? <span className={styles.meetingMeta}><DashboardIcon name="clock" size={16} />{meetingTimes(row.startsAt, row.endsAt)}</span> : null}
        {row.venue ? <span className={styles.meetingMeta}><DashboardIcon name="building" size={16} />{row.venue}</span> : null}
        {row.creatorName ? <span className={`${styles.meetingMeta} ${styles.meetingCreator}`}><DashboardIcon name="people" size={16} />Created by {row.creatorName}</span> : null}
      </button></li>)}</ul>
      <p className={styles.infoLine}><DashboardIcon name="shield" size={16} /><span>Choose a meeting to open your own report. You’ll confirm your attendance there.</span></p>
    </section> : <section className={styles.missing} role="status">
      <span className={styles.missingIcon}><DashboardIcon name="calendar" /></span>
      <h2>Meeting not listed yet</h2>
      <p className={styles.muted}>The person who led the meeting must create it before you can add your report. Return later to select it.</p>
      {query ? <button type="button" className={styles.primary} onClick={() => setQuery("")}>Back to meetings<DashboardIcon name="left" /></button>
        : onRefresh ? <button type="button" className={styles.textButton} onClick={onRefresh}>Check again</button> : null}
    </section>}
  </>;
}
