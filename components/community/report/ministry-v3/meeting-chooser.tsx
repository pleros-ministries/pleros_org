"use client";
import { useState } from "react";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import { meetingDateLong, meetingTimes, type SharedMeetingView } from "./meeting-form";
import styles from "./ministry-form.module.css";

/** Paper: Pleros-report-meeting-select / -meeting-missing. Selection only; never creates a meeting or request. */
export function MeetingChooser<T extends SharedMeetingView>({ meetings, onChoose, onRefresh, onCreate }: {
  meetings: T[]; onChoose: (meeting: T) => void; onRefresh?: () => void;
  /** "I led a meeting": shown right under the empty state, or after the list. */
  onCreate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle ? meetings.filter(row => `${row.subject ?? "Prayer meeting"} ${row.venue ?? ""} ${row.creatorName ?? ""}`.toLowerCase().includes(needle)) : meetings;
  const create = onCreate ? <button type="button" className={styles.secondaryWide} onClick={onCreate}>I led a meeting · Create it</button> : null;
  return <>
    {/* Nothing to search until a meeting exists (user feedback, 18 October). */}
    {meetings.length || query ? <label className={styles.search}><span className={styles.srOnly}>Search meetings or venues</span><DashboardIcon name="search" size={20} /><input type="search" placeholder="Search meetings or venues" value={query} onChange={event => setQuery(event.target.value)} />{query ? <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => setQuery("")}><DashboardIcon name="close" size={16} /></button> : null}</label> : null}
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
      {create}
    </section> : <section className={styles.missing} role="status">
      <span className={styles.missingIcon}><DashboardIcon name="calendar" /></span>
      <h2>{query ? "No meeting matches that" : "No meetings for this day yet"}</h2>
      <p className={styles.muted}>{query ? "Try another name or venue." : "Ask whoever led it to create it, or create it yourself if you led it."}</p>
      {query ? <button type="button" className={styles.primary} onClick={() => setQuery("")}>Back to meetings<DashboardIcon name="left" /></button> : <>
        {create}
        {onRefresh ? <button type="button" className={styles.textButton} onClick={onRefresh}>Check again</button> : null}
      </>}
    </section>}
  </>;
}
