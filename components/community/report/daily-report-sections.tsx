"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BookOpenIcon, CheckIcon, ChevronDownIcon, HeartHandshakeIcon, UsersRoundIcon } from "lucide-react";

import { clearDailyReportDeclaration, declareDailyReport } from "@/app/(site)/dashboard/community/_actions/daily-report-actions";
import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration, type DailyReportStatus } from "@/lib/community/daily-report";
import { activityKindLabel } from "@/lib/community/ministry-activities";
import { MINISTRY_FIELDS, type ActivityLine } from "@/lib/community/ministry-report";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";

import { ActivityCard } from "./activity-card";
import { dayHref } from "./day-picker";
import { LiveMeetingFlow } from "./ministry-v3/live-meeting-flow";
import { LiveMinistryForm } from "./ministry-v3/live-ministry-form";
import { useReportAction } from "./use-report-action";
import { BibleReadingInline, PrayerWatchInline } from "./devotion-inline";
import styles from "./daily-report-sections.module.css";

const devotionalRoutes: Record<ActivityLine["key"], string> = {
  prayerWatch: "/dashboard/prayer-watch", bible: "/dashboard/prayer-watch",
  podcast: "/dashboard/podcast", sogp: "/dashboard/sogp",
};
/** Matches the review sheet exit in daily-report-sections.module.css. */
const REVIEW_EXIT_MS = 180;
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
const longDate = (date: Date) => `${weekday.format(date)}, ${dayMonth.format(date)}`;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "12 reached · 3 saved" from an activity's stored numbers. */
function numbersLine(activity: MemberActivity) {
  const parts = MINISTRY_FIELDS
    .map(field => ({ field, value: (activity as unknown as Record<string, number | null>)[field.key] ?? 0 }))
    .filter(row => row.value > 0)
    .map(row => `${row.value} ${row.field.short.toLowerCase()}`);
  return parts.length ? parts.join(" · ") : `${plural(activity.peopleCount, "person", "people")}`;
}

function activityLine(activity: MemberActivity) {
  const where = activity.location ? ` at ${activity.location}` : activity.title ? ` · ${activity.title}` : "";
  return `${activityKindLabel(activity.kind)}${where}: ${numbersLine(activity)}`;
}

type Tone = "ready" | "todo" | "nil";
function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>;
}

/** One collapsible section (Pastor, 18 October): the page never sends you elsewhere to fill a part. */
function Section({ id, icon, tone, title, summary, status, statusTone, open, onToggle, children }: {
  id: string; icon: ReactNode; tone: [string, string]; title: string; summary: string; status: string; statusTone: Tone;
  open: boolean; onToggle: () => void; children: ReactNode;
}) {
  return <section className={styles.section} data-open={open || undefined}>
    <button type="button" className={styles.head} aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
      <span className={styles.icon} style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{icon}</span>
      <span className={styles.titles}><span className={styles.title}>{title}</span><span className={styles.summary}>{summary}</span></span>
      <Pill tone={statusTone}>{status}</Pill>
      <ChevronDownIcon className={styles.chev} aria-hidden="true" />
    </button>
    {open ? <div id={`${id}-body`} className={styles.body}>{children}</div> : null}
  </section>;
}

/** A nested section inside Ministry or Meetings (Evangelism, Discipleship, Add a meeting). */
function Sub({ title, meta, open, onToggle, children }: { title: string; meta?: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return <div className={styles.sub} data-open={open || undefined}>
    <button type="button" className={styles.subHead} aria-expanded={open} onClick={onToggle}>
      <span className={styles.subTitle}>{title}</span>{meta ? <span className={styles.subMeta}>{meta}</span> : null}
      <ChevronDownIcon className={styles.chev} aria-hidden="true" />
    </button>
    {open ? <div className={styles.subBody}>{children}</div> : null}
  </div>;
}

export type ReportMeetingUnits = { id: number; name: string; branchId: number }[];

/**
 * My reports as one page (Pastor voice note, 18 October): Devotion, Ministry and
 * Meetings open and close in place; Ministry opens into Evangelism and
 * Discipleship and Meetings into each meeting, all filled here. "Review and
 * submit" shows the day's report; confirming records devotion and marks any
 * empty section as nothing today, in one step.
 */
export function DailyReportSections({ today, days, selected, activities, pleros, devotion, declarations, meetingDetails, enabled, week = null, inline, contacts = [], units = [], initialMeetings }: {
  today: string; days: string[]; selected: string; activities: MemberActivity[]; pleros: ActivityLine[];
  /** The day's raw Prayer Watch sessions and Bible reading, for filling them in place. */
  devotion?: { prayerWatch: string[]; bible: { chapters: number; book: string; chapter: number } | null };
  declarations: { category: string; declaration: string }[];
  meetingDetails: { activityId: number; reportingRole: string; taught: string | null; shared?: boolean; attended?: boolean; peopleBrought?: number; totalAttendance?: number | null }[];
  enabled: boolean;
  week?: Record<string, "complete" | "partial" | "missing"> | null;
  /** Inline forms need the reporting v3 schema; without it the sections link to the step forms. */
  inline: boolean;
  contacts?: MinistryContact[];
  units?: ReportMeetingUnits;
  initialMeetings?: Parameters<typeof LiveMeetingFlow>[0]["initialMeetings"];
}) {
  const { run, pending, error } = useReportAction();
  const [openLine, setOpenLine] = useState<"bible" | "prayerWatch" | null>(null);
  const writable = days.includes(selected);
  const ministry = activities.filter(activity => activity.kind === "outreach" || activity.kind === "follow_up");
  const meetings = activities.filter(activity => activity.kind !== "outreach" && activity.kind !== "follow_up");
  const recorded = pleros.filter(line => Boolean(line.detail));
  const declared = (key: DailyReportCategory) => (declarations.find(row => row.category === key)?.declaration ?? null) as DailyReportDeclaration | null;
  const statuses: Record<DailyReportCategory, DailyReportStatus> = {
    devotional: dailyCategoryStatus({ category: "devotional", declaration: declared("devotional"), activityCount: 0, hasDevotionalActivity: recorded.length > 0 }),
    ministry: dailyCategoryStatus({ category: "ministry", declaration: declared("ministry"), activityCount: ministry.length, hasDevotionalActivity: false }),
    meetings: dailyCategoryStatus({ category: "meetings", declaration: declared("meetings"), activityCount: meetings.length, hasDevotionalActivity: false }),
  };
  const submitted = Object.values(statuses).every(status => status !== "missing");
  // A section counts as ready for review once it has something in it or was marked nothing.
  const ready = {
    devotional: statuses.devotional !== "missing" || recorded.length > 0,
    ministry: statuses.ministry !== "missing",
    meetings: statuses.meetings !== "missing",
  };
  const readyCount = Object.values(ready).filter(Boolean).length;

  const [open, setOpen] = useState<DailyReportCategory | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  // "closing" keeps the sheet mounted while it sinks away (REVIEW_EXIT_MS matches the CSS).
  const [review, setReview] = useState<"open" | "closing" | null>(null);
  const closeReview = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setReview(null); return; }
    setReview("closing");
    window.setTimeout(() => setReview(current => current === "closing" ? null : current), REVIEW_EXIT_MS);
  };
  const toggle = (key: DailyReportCategory) => { setOpen(current => (current === key ? null : key)); setSub(null); };
  const dayWord = selected === today ? "today" : "this day";
  const addHref = `/dashboard/community/report/new?day=${encodeURIComponent(selected)}`;

  const nothing = (key: DailyReportCategory) => run(() => declareDailyReport({ dateKey: selected, category: key, declaration: "nil" }), { onDone: () => setOpen(null) });
  const undo = (key: DailyReportCategory) => run(() => clearDailyReportDeclaration({ dateKey: selected, category: key }));
  // Confirm and submit: devotion is confirmed and any empty section becomes "nothing today".
  const submit = () => run(async () => {
    if (statuses.devotional === "missing") {
      const result = await declareDailyReport({ dateKey: selected, category: "devotional", declaration: "confirmed" });
      if (!result.ok) return result;
    }
    for (const key of ["ministry", "meetings"] as const) {
      if (statuses[key] !== "missing") continue;
      const result = await declareDailyReport({ dateKey: selected, category: key, declaration: "nil" });
      if (!result.ok) return result;
    }
    return { ok: true as const };
  }, { onDone: () => { closeReview(); setOpen(null); } });

  const statusFor = (key: DailyReportCategory): { label: string; tone: Tone } => {
    if (key === "devotional") return statuses.devotional !== "missing" ? { label: "Confirmed", tone: "ready" } : recorded.length ? { label: "To confirm", tone: "todo" } : { label: "Nothing yet", tone: "todo" };
    if (statuses[key] === "nil") return { label: `Nothing ${dayWord}`, tone: "nil" };
    if (statuses[key] === "reported") return { label: "Ready", tone: "ready" };
    return { label: "Not filled", tone: "todo" };
  };
  const ministrySummary = ministry.length ? ministry.map(numbersLine).join(" · ") : statuses.ministry === "nil" ? "No ministry activity" : "Evangelism and discipleship";
  const meetingSummary = meetings.length ? meetings.map(row => activityKindLabel(row.kind)).join(", ") : statuses.meetings === "nil" ? "No meetings" : "Teaching, prayer and other meetings";

  const onSaved = () => { setSub(null); };
  const nilRow = (key: DailyReportCategory) => writable && enabled ? <div className={styles.rowActions}>
    {statuses[key] === "nil"
      ? <button type="button" className={styles.quiet} disabled={pending} onClick={() => undo(key)}>Undo “nothing {dayWord}”</button>
      : statuses[key] === "missing" ? <button type="button" className={styles.secondary} disabled={pending} onClick={() => nothing(key)}>Nothing {dayWord}</button> : <span />}
    <button type="button" className={styles.done} onClick={() => setOpen(null)}>Done</button>
  </div> : null;

  return <div className={styles.page}>
    <header className={styles.dayHeader}>
      <div><h1>My reports</h1><p className={styles.meta}>{longDate(new Date(`${selected}T00:00:00Z`))}</p></div>
      <Link href="/dashboard/community/report/history" className={styles.secondary}>History</Link>
    </header>

    {week ? <nav aria-label="Choose a day" className={styles.week}>
      {days.slice().reverse().slice(-7).map(dateKey => {
        const date = new Date(`${dateKey}T00:00:00Z`);
        const state = week[dateKey];
        const tone = state === "complete" ? "var(--color-community-blue, #2056d6)" : state === "partial" ? "#d98a1f" : dateKey === today ? "#e2e5ea" : "#c94a4a";
        return <Link key={dateKey} href={dayHref(dateKey, today)} aria-current={dateKey === selected ? "page" : undefined} aria-label={`${longDate(date)}: ${state ?? "not reported"}`}>
          <span>{weekday.format(date).slice(0, 1)}</span><b>{date.getUTCDate()}</b><i style={{ background: tone }} aria-hidden="true" />
        </Link>;
      })}
    </nav> : null}
    {!writable ? <p className={styles.meta}>This day is view only. Reports can be changed for today and the previous seven days.</p> : null}
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}

    <Section id="report-devotion" icon={<BookOpenIcon className="size-4" strokeWidth={2} />} tone={["#e4ebfd", "#2331ae"]} title="Devotion"
      summary={`${recorded.length} of ${pleros.length} done ${dayWord}`} status={statusFor("devotional").label} statusTone={statusFor("devotional").tone}
      open={open === "devotional"} onToggle={() => toggle("devotional")}>
      <ul className={styles.lines}>{pleros.map(line => {
        const body = <>
          <span className={styles.tick} data-on={line.detail ? "" : undefined} aria-hidden="true">{line.detail ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
          <span className={styles.lineCopy}><span>{line.label}</span><span className={styles.meta}>{line.detail ?? "Not recorded"}</span></span>
          <DashboardIcon name="right" size={16} />
        </>;
        // Prayer Watch and Bible reading fill in here; SOGP and the podcast record themselves as you learn.
        if (devotion && writable && (line.key === "prayerWatch" || line.key === "bible")) {
          const expanded = openLine === line.key;
          return <li key={line.key}>
            <button type="button" className={`${styles.line} ${styles.lineButton}`} aria-expanded={expanded} onClick={() => setOpenLine(expanded ? null : line.key as "bible" | "prayerWatch")}>{body}</button>
            {expanded ? line.key === "prayerWatch"
              ? <PrayerWatchInline date={selected} attended={devotion.prayerWatch} disabled={false} />
              : <BibleReadingInline date={selected} initial={devotion.bible} disabled={false} onSaved={() => setOpenLine(null)} /> : null}
          </li>;
        }
        return <li key={line.key}><Link className={styles.line} href={`${devotionalRoutes[line.key]}?date=${encodeURIComponent(selected)}${line.key === "bible" ? "&tab=bible" : ""}`}>{body}</Link></li>;
      })}</ul>
      <p className={styles.hint}>Tap Prayer Watch or Bible reading to fill them in here. SOGP and the podcast fill in as you learn and listen. You confirm them when you submit.</p>
      {writable && enabled && statuses.devotional !== "missing" ? <div className={styles.rowActions}><button type="button" className={styles.quiet} disabled={pending} onClick={() => undo("devotional")}>Undo confirmation</button><button type="button" className={styles.done} onClick={() => setOpen(null)}>Done</button></div>
        : <div className={styles.rowActions}><span /><button type="button" className={styles.done} onClick={() => setOpen(null)}>Done</button></div>}
    </Section>

    <Section id="report-ministry" icon={<HeartHandshakeIcon className="size-4" strokeWidth={2} />} tone={["#dcefe3", "#1f6b45"]} title="Ministry"
      summary={ministrySummary} status={statusFor("ministry").label} statusTone={statusFor("ministry").tone}
      open={open === "ministry"} onToggle={() => toggle("ministry")}>
      {ministry.length ? <ul className={styles.saved}>{ministry.map(activity => <ActivityCard key={activity.id} activity={activity} today={today} canChange={writable} />)}</ul> : null}
      {writable ? (inline ? <>
        <Sub title="Evangelism" meta={ministry.some(row => row.kind === "outreach") ? "Add another" : undefined} open={sub === "outreach"} onToggle={() => setSub(current => current === "outreach" ? null : "outreach")}>
          <LiveMinistryForm embedded dateKey={selected} today={today} contacts={contacts} initial={{ kind: "outreach" }} onSaved={onSaved} />
        </Sub>
        <Sub title="Discipleship" meta={ministry.some(row => row.kind === "follow_up") ? "Add another" : undefined} open={sub === "follow_up"} onToggle={() => setSub(current => current === "follow_up" ? null : "follow_up")}>
          <LiveMinistryForm embedded dateKey={selected} today={today} contacts={contacts} initial={{ kind: "follow_up" }} onSaved={onSaved} />
        </Sub>
      </> : <Link href={`${addHref}&category=ministry`} className={styles.secondary}>+ Log ministry</Link>) : null}
      {nilRow("ministry")}
    </Section>

    <Section id="report-meetings" icon={<UsersRoundIcon className="size-4" strokeWidth={2} />} tone={["#f6d9de", "#7a2e45"]} title="Meetings"
      summary={meetingSummary} status={statusFor("meetings").label} statusTone={statusFor("meetings").tone}
      open={open === "meetings"} onToggle={() => toggle("meetings")}>
      {meetings.length ? <ul className={styles.saved}>{meetings.map(activity => <ActivityCard key={activity.id} activity={activity} meetingDetails={meetingDetails.find(row => row.activityId === activity.id)} today={today} canChange={writable} />)}</ul> : null}
      {writable ? (inline ? <Sub title={meetings.length ? "Add another meeting" : "Add a meeting"} meta="Teaching, prayer or other" open={sub === "meeting"} onToggle={() => setSub(current => current === "meeting" ? null : "meeting")}>
        <LiveMeetingFlow embedded dateKey={selected} today={today} units={units} contacts={contacts} initialMeetings={initialMeetings} onSaved={onSaved} />
      </Sub> : <Link href={`${addHref}&category=meetings`} className={styles.secondary}>+ Log a meeting</Link>) : null}
      {nilRow("meetings")}
    </Section>

    {writable ? <p className={styles.meta}>You can report for today and the past 7 days. We’ll remind you at 8 pm if anything’s missing.</p> : null}

    {/* Floats while browsing; stays in the flow while a section is open so it never covers a form. */}
    {writable && enabled ? <div className={styles.bar} data-floating={open === null || undefined}>
      {submitted
        ? <div className={styles.submitted}><CheckIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />Report submitted for {dayWord}. Open a section to change it.</div>
        : <>
          <span className={styles.barMeta}>{readyCount} of 3 sections ready</span>
          <button type="button" className={styles.submit} disabled={pending} onClick={() => setReview("open")}>Review and submit</button>
        </>}
    </div> : null}

    {review ? <div className={styles.shade} data-closing={review === "closing" || undefined} role="presentation" onClick={event => { if (event.target === event.currentTarget) closeReview(); }}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="report-review-title">
        <span className={styles.grab} aria-hidden="true" />
        <h2 id="report-review-title" data-dashboard-shell-title>Your report for {selected === today ? "today" : weekday.format(new Date(`${selected}T00:00:00Z`))}</h2>
        <p className={styles.meta}>Check it, then send it to your oversight.</p>
        <div className={styles.review}>
          <b>Devotion</b>
          <p>{recorded.length ? recorded.map(line => `${line.label}${line.detail ? ` (${line.detail})` : ""}`).join(" · ") : `No Bible reading, Prayer Watch, SOGP or podcast logged ${dayWord}.`}</p>
        </div>
        <div className={styles.review}>
          <b>Ministry</b>
          <p>{ministry.length ? ministry.map(activityLine).join(". ") : `Nothing ${dayWord}`}</p>
        </div>
        <div className={styles.review}>
          <b>Meetings</b>
          <p>{meetings.length ? meetings.map(activityLine).join(". ") : `Nothing ${dayWord}`}</p>
        </div>
        <div className={styles.sheetActions}>
          <button type="button" className={styles.submit} disabled={pending} onClick={submit}>{pending ? "Submitting…" : "Confirm and submit"}</button>
          <button type="button" className={styles.secondary} disabled={pending} onClick={closeReview}>Edit</button>
        </div>
      </div>
    </div> : null}
  </div>;
}
