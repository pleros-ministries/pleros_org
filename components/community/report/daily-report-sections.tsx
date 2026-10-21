"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { BookOpenIcon, CheckIcon, ChevronRightIcon, HeartHandshakeIcon, PlusIcon, TargetIcon, UsersRoundIcon } from "lucide-react";

import { clearDailyReportDeclaration, declareDailyReport } from "@/app/(site)/dashboard/community/_actions/daily-report-actions";
import { logPlanReadingAction } from "@/app/(site)/dashboard/community/_actions/report-popup-actions";
import { saveMeetingAction, saveNoReasonAction } from "@/app/(site)/dashboard/community/_actions/report-answer-actions";
import { deleteMinistryActivity } from "@/app/(site)/dashboard/community/_actions/report-actions";
import { MEETING_LABEL, meetingLine, type NoPart } from "@/lib/community/meeting-report";
import type { NoReasons, OwnMeetingDetail } from "@/lib/db/queries/report-answers";
import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration, type DailyReportStatus } from "@/lib/community/daily-report";
import { activityKindLabel } from "@/lib/community/ministry-activities";
import { MINISTRY_FIELDS, type ActivityLine } from "@/lib/community/ministry-report";
import type { MinistryContact } from "@/lib/community/reporting-v3";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { readingEnd, teachingLabel, type MinistryEdit } from "@/lib/community/report-popups";
import { prayerSessionsLine } from "@/lib/prayer-watch-session";
import type { BibleDay, TeachingReport } from "@/lib/db/queries/report-popups";

import { ActivityCard } from "./activity-card";
import { dayHref } from "./day-picker";
import { BibleFreeSheet, BiblePlanSheet, BibleTodaySheet, PrayerWatchSheet, TeachingSheet } from "./devotion-sheets";
import { MeetingSheet, NoRow, ReasonSheet, YesNoRow, type MeetingDraft } from "./answer-sheets";
import { DiscipleshipSheet, EvangelismSheet } from "./ministry-sheets";
import { useReportAction } from "./use-report-action";
import styles from "./daily-report-sections.module.css";

/** What a devotion save shows before the page refreshes; undefined fields fall back to the server's data. */
type DevotionOverride = { date: string; prayer?: string[]; times?: string[]; bible?: string; teaching?: string };
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

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
  if (parts.length) return parts.join(" · ");
  return activity.kind === "outreach" && !activity.peopleCount ? "reach not counted" : plural(activity.peopleCount, "person", "people");
}

function activityLine(activity: MemberActivity) {
  const where = activity.location ? ` at ${activity.location}` : activity.title ? ` · ${activity.title}` : "";
  return `${activityKindLabel(activity.kind)}${where}: ${numbersLine(activity)}`;
}

type Tone = "ready" | "todo" | "nil";
function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={styles.pill} data-tone={tone}>{children}</span>;
}

/** A report card: its rows open pop-ups, so the page never sends you elsewhere to fill a part. */
function Card({ icon, tone, title, status, statusTone, children, footer }: {
  icon: ReactNode; tone: [string, string]; title: string; status: string; statusTone: Tone; children: ReactNode; footer?: ReactNode;
}) {
  return <section className={styles.card} aria-label={title}>
    <div className={styles.cardHead}>
      <span className={styles.icon} style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{icon}</span>
      <h2 className={styles.title}>{title}</h2>
      <Pill tone={statusTone}>{status}</Pill>
    </div>
    {children}
    {footer ? <div className={styles.cardFoot}>{footer}</div> : null}
  </section>;
}

function Tick({ on }: { on: boolean }) {
  return <span className={styles.tick} data-on={on ? "" : undefined} aria-hidden="true">{on ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>;
}

/**
 * One row of a card: the whole row opens its pop-up. `end` sits inside the tap
 * target (a chevron by default); `action` is a separate button beside it.
 */
function Row({ tick, title, detail, end, action, onOpen, href }: {
  tick?: boolean; title: string; detail: string; end?: ReactNode; action?: ReactNode; onOpen?: () => void; href?: string;
}) {
  const body = <>
    {tick === undefined ? null : <Tick on={tick} />}
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowDetail}>{detail}</span></span>
    {action ? null : end ?? (onOpen || href ? <ChevronRightIcon className={styles.chev} aria-hidden="true" /> : null)}
  </>;
  if (href) return <Link className={styles.row} href={href}>{body}</Link>;
  return <div className={styles.row}>
    <button type="button" className={styles.rowButton} onClick={onOpen} disabled={!onOpen}>{body}</button>
    {action}
  </div>;
}

function AddLabel() {
  return <span className={styles.add} aria-hidden="true"><PlusIcon className="size-4" />Add</span>;
}

type Popup = "biblePlan" | "bibleToday" | "prayerWatch" | "teaching" | "evangelism" | "discipleship" | "meeting";
const PART_KIND = { evangelism: "outreach", discipleship: "follow_up" } as const;
const MEETING_KIND_LABEL: Record<string, string> = { teaching_meeting: MEETING_LABEL.teaching, prayer_meeting: MEETING_LABEL.prayer, outreach_meeting: MEETING_LABEL.outreach };

/**
 * My reports as one page (Pastor, 18 October workers' meeting): Devotion,
 * Ministry and Meetings are cards whose rows open pop-ups, never another page.
 * Bible reading follows a chapter-a-day plan with a one-tap Done; Teaching
 * covers SOGP and the podcast; Evangelism is broadcast or one-to-one;
 * Discipleship is ticked. Evangelism, Discipleship and Meetings are answered
 * Yes or No, and No needs a reason (Pastor, 21 October); "Review and submit"
 * confirms devotion once every part is answered.
 */
export function DailyReportSections({ today, days, selected, activities, edits = {}, pleros, devotion, declarations, meetingDetails, enabled, week = null, inline, contacts = [], noReasons = {}, meetingReports = [], venues = [], bibleDay, teaching = null, teachings = [], popupsReady = false, assignment, preview = false }: {
  today: string; days: string[]; selected: string; activities: MemberActivity[]; pleros: ActivityLine[];
  /** Saved evangelism and discipleship reports that reopen in their pop-up, by activity id. */
  edits?: Record<number, MinistryEdit>;
  /** The day's raw Prayer Watch sessions and Bible reading, for filling them in place. */
  devotion?: { prayerWatch: string[]; prayerTimes?: string[]; bible: { chapters: number; book: string; chapter: number } | null };
  declarations: { category: string; declaration: string }[];
  meetingDetails: { activityId: number; reportingRole: string; taught: string | null; shared?: boolean; attended?: boolean; peopleBrought?: number; totalAttendance?: number | null }[];
  enabled: boolean;
  week?: Record<string, "complete" | "partial" | "missing"> | null;
  /** The pop-up forms need the reporting v3 schema; without it the ministry rows link to the step forms. */
  inline: boolean;
  contacts?: MinistryContact[];
  /** Reasons given for a No this day (migration 0075). */
  noReasons?: NoReasons;
  /** Meetings reported through the meetings pop-up: led or attended, times, numbers. */
  meetingReports?: OwnMeetingDetail[];
  /** Venues of meetings this person led before, to pick from. */
  venues?: string[];
  /** Sample data under /preview: answers and meetings show on screen only, and the other pop-ups stay shut. */
  preview?: boolean;
  /** The Bible reading plan and where it stands on this day (migration 0068). */
  bibleDay?: BibleDay;
  teaching?: TeachingReport | null;
  /** This week's SOGP teachings, for the discipleship "What did you teach?" choices. */
  teachings?: string[];
  /** Migration 0068 is applied: plans and Teaching notes can be saved. */
  popupsReady?: boolean;
  /** The day's natural assignment (migration 0073), for the Other reports card; undefined hides it. */
  assignment?: { goals: number; todos: number; done: number };
}) {
  const { run, pending, error } = useReportAction();
  const router = useRouter();
  const [popup, setPopup] = useState<Popup | null>(null);
  // Optimistic devotion (user request, 20 October): what was just saved shows at once, for this day only.
  const [override, setOverride] = useState<DevotionOverride>({ date: selected });
  const [saveError, setSaveError] = useState<string | null>(null);
  const shown = override.date === selected ? override : { date: selected };
  const [, startSave] = useTransition();
  /** Shows the patch now, saves in the background, and puts the row back if the save fails. */
  const optimisticSave = (patch: Omit<DevotionOverride, "date">, action: () => Promise<{ ok: boolean; error?: string }>) => {
    const before = shown;
    setOverride({ ...shown, ...patch, date: selected });
    setSaveError(null);
    startSave(async () => {
      const result = await action().catch(() => ({ ok: false, error: "That couldn’t be saved. Try again." }));
      if (!result.ok) { setOverride(before); setSaveError(result.error ?? "That couldn’t be saved. Try again."); return; }
      router.refresh();
    });
  };
  const [editing, setEditing] = useState<MinistryEdit | null>(null);
  // Optimistic answers (Pastor, 21 October): a No or a meeting shows at once and rolls back if the save fails.
  const [localNo, setLocalNo] = useState<{ date: string; reasons: Partial<Record<NoPart, string | null>> }>({ date: selected, reasons: {} });
  const [drafts, setDrafts] = useState<(MeetingDraft & { id: number })[]>([]);
  const [noSheet, setNoSheet] = useState<NoPart | null>(null);
  // Saved meetings arrive with the refreshed page, so the drafts standing in for them go.
  useEffect(() => { setDrafts([]); }, [activities]);
  const close = () => setPopup(null);
  // A preview never saves, so only the meetings pop-up (which saves through the page) opens.
  const open = (next: Popup) => { if (!preview || next === "meeting") setPopup(next); };
  const writable = days.includes(selected);
  const ministry = activities.filter(activity => activity.kind === "outreach" || activity.kind === "follow_up");
  const meetings = activities.filter(activity => activity.kind !== "outreach" && activity.kind !== "follow_up");
  const reasons = localNo.date === selected ? localNo.reasons : {};
  const reasonOf = (part: NoPart) => part in reasons ? reasons[part] ?? null : noReasons[part] ?? null;
  const detailOf = (activityId: number) => meetingReports.find(row => row.activityId === activityId);
  const line = (key: ActivityLine["key"]) => pleros.find(row => row.key === key)?.detail ?? null;
  const sogpDetail = line("sogp"), podcastDetail = line("podcast");
  const teachingDone = Boolean(sogpDetail || podcastDetail || teaching || shown.teaching);
  const bibleDone = shown.bible !== undefined ? Boolean(shown.bible) : Boolean(devotion?.bible ?? line("bible"));
  const prayerLine = shown.prayer !== undefined
    ? prayerSessionsLine(shown.prayer, shown.times ?? devotion?.prayerTimes ?? [])
    : devotion?.prayerTimes?.length ? prayerSessionsLine(devotion.prayerWatch, devotion.prayerTimes) : line("prayerWatch");
  const prayerDone = Boolean(prayerLine);
  const devotionDone = [bibleDone, prayerDone, teachingDone].filter(Boolean).length;
  const declared = (key: DailyReportCategory) => (declarations.find(row => row.category === key)?.declaration ?? null) as DailyReportDeclaration | null;
  const statuses: Record<DailyReportCategory, DailyReportStatus> = {
    devotional: dailyCategoryStatus({ category: "devotional", declaration: declared("devotional"), activityCount: 0, hasDevotionalActivity: devotionDone > 0 }),
    ministry: dailyCategoryStatus({ category: "ministry", declaration: declared("ministry"), activityCount: ministry.length, hasDevotionalActivity: false }),
    meetings: dailyCategoryStatus({ category: "meetings", declaration: declared("meetings"), activityCount: meetings.length, hasDevotionalActivity: false }),
  };
  const submitted = Object.values(statuses).every(status => status !== "missing");
  // Each part is answered by something saved, a reason for No, or an older "nothing" for the day.
  const partAnswered = (part: "evangelism" | "discipleship") => ministry.some(row => row.kind === PART_KIND[part]) || Boolean(reasonOf(part)) || statuses.ministry === "nil";
  const meetingsAnswered = meetings.length > 0 || drafts.length > 0 || Boolean(reasonOf("meetings")) || statuses.meetings === "nil";
  const ministryAnswered = partAnswered("evangelism") && partAnswered("discipleship");
  const allAnswered = ministryAnswered && meetingsAnswered;
  // A section counts as ready for review once it has something in it or was marked nothing.
  const ready = {
    devotional: statuses.devotional !== "missing" || devotionDone > 0,
    ministry: ministryAnswered,
    meetings: meetingsAnswered,
  };
  const readyCount = Object.values(ready).filter(Boolean).length;

  // "closing" keeps the review sheet mounted while it sinks away (REVIEW_EXIT_MS matches the CSS).
  const [review, setReview] = useState<"open" | "closing" | null>(null);
  const closeReview = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setReview(null); return; }
    setReview("closing");
    window.setTimeout(() => setReview(current => current === "closing" ? null : current), REVIEW_EXIT_MS);
  };
  const dayWord = selected === today ? "today" : "this day";
  const addHref = `/dashboard/community/report/new?day=${encodeURIComponent(selected)}`;

  const undo = (key: DailyReportCategory) => run(() => clearDailyReportDeclaration({ dateKey: selected, category: key }));
  // Confirm and submit: every part is already answered Yes or No, so only devotion is confirmed.
  const submit = () => run(async () => {
    if (statuses.devotional === "missing") return declareDailyReport({ dateKey: selected, category: "devotional", declaration: "confirmed" });
    return { ok: true as const };
  }, { onDone: closeReview });
  /** Shows the No at once, saves it, and takes it back with a message if the save fails. */
  const answerNo = (part: NoPart, reason: string) => {
    const before = reasons;
    setLocalNo({ date: selected, reasons: { ...reasons, [part]: reason } });
    setSaveError(null);
    if (preview) return;
    startSave(async () => {
      const result = await saveNoReasonAction({ dateKey: selected, part, reason }).catch(() => ({ ok: false as const, error: "That couldn’t be saved. Try again." }));
      if (!result.ok) { setLocalNo({ date: selected, reasons: before }); setSaveError(result.error); return; }
      router.refresh();
    });
  };
  const addMeeting = (draft: MeetingDraft) => {
    const id = Date.now();
    setDrafts(list => [...list, { ...draft, id }]);
    setSaveError(null);
    if (preview) return;
    startSave(async () => {
      const result = await saveMeetingAction({ dateKey: selected, meeting: draft.meeting }).catch(() => ({ ok: false as const, error: "That couldn’t be saved. Try again." }));
      if (!result.ok) { setDrafts(list => list.filter(row => row.id !== id)); setSaveError(result.error); return; }
      router.refresh();
    });
  };
  const ministryLine = [
    ...ministry.filter(row => row.kind === "outreach").slice(0, 1).map(row => `Evangelism: ${numbersLine(row)}`),
    ...ministry.filter(row => row.kind === "follow_up").slice(0, 1).map(row => `Discipleship: ${numbersLine(row)}`),
  ].join(" · ") || null;
  // The one-tap Done on Bible reading logs the plan's chapters for the day.
  const tickBible = () => {
    if (!plan || !reading) return;
    const end = readingEnd(reading.start, plan.chaptersPerDay);
    optimisticSave({ bible: `${plural(plan.chaptersPerDay, "chapter")}, now at ${end.book} ${end.chapter}` }, () => logPlanReadingAction({ dateKey: selected }));
  };

  const statusFor = (key: DailyReportCategory): { label: string; tone: Tone } => {
    if (key === "devotional") return statuses.devotional !== "missing" ? { label: "Confirmed", tone: "ready" } : { label: `${devotionDone} of 3`, tone: devotionDone === 3 ? "ready" : "todo" };
    const answered = key === "ministry" ? ministryAnswered : meetingsAnswered;
    const something = key === "ministry" ? ministry.length > 0 : meetings.length + drafts.length > 0;
    if (!answered) return { label: "Not filled", tone: "todo" };
    return something ? { label: "Ready", tone: "ready" } : { label: `Nothing ${dayWord}`, tone: "nil" };
  };
  /** Evangelism or discipleship: more of it, its No, or the question. */
  const partRow = (part: "evangelism" | "discipleship") => {
    const title = part === "evangelism" ? "Evangelism" : "Discipleship";
    const reason = reasonOf(part);
    if (ministry.some(row => row.kind === PART_KIND[part])) return writable ? <Row title={title} detail="Add another" onOpen={() => open(part)} end={<AddLabel />} /> : null;
    if (reason || statuses.ministry === "nil") return <NoRow title={title} reason={reason ?? `Nothing ${dayWord}`} onOpen={writable ? () => setNoSheet(part) : undefined} />;
    if (!writable) return <Row title={title} detail="Not answered" />;
    return <YesNoRow title={title} question={part === "evangelism" ? `Did you do any evangelism ${dayWord}?` : `Did you disciple anyone ${dayWord}?`} onNo={() => setNoSheet(part)} onYes={() => open(part)} />;
  };

  // ─── Devotion rows ─────────────────────────────────────────────────────────
  const plan = bibleDay?.plan ?? null, reading = bibleDay?.reading ?? null;
  const bibleLogged = bibleDay?.logged ?? devotion?.bible ?? null;
  const bibleDetail = shown.bible ? shown.bible : bibleLogged
    ? `${plural(bibleLogged.chapters, "chapter")}, now at ${bibleLogged.book} ${bibleLogged.chapter}`
    : reading ? `${selected === today ? "Today" : "This day"}: ${reading.label} · ${plan?.chaptersPerDay} a day plan`
    : popupsReady ? "Choose a chapters-a-day plan" : "Not recorded";
  const openBible = () => open(plan && reading ? "bibleToday" : popupsReady ? "biblePlan" : "bibleToday");
  const teachingDetail = shown.teaching ?? ([sogpDetail ? `SOGP: ${sogpDetail}` : null, podcastDetail ? `podcast: ${podcastDetail}` : null].filter(Boolean).join(" · ")
    || (teaching ? `${teachingLabel(teaching.source, teaching.otherTitle)}${teaching.note ? " · note added" : ""}` : "SOGP, podcast or other"));
  const canFillDevotion = writable && Boolean(devotion);

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
    {saveError ? <p role="alert" className={styles.error}>{saveError}</p> : null}

    <Card icon={<BookOpenIcon className="size-4" strokeWidth={2} />} tone={["#e4ebfd", "#2331ae"]} title="Devotion"
      status={statusFor("devotional").label} statusTone={statusFor("devotional").tone}
      footer={writable && enabled && statuses.devotional !== "missing" ? <button type="button" className={styles.quiet} disabled={pending} onClick={() => undo("devotional")}>Undo confirmation</button> : undefined}>
      <Row tick={bibleDone} title="Bible reading" detail={bibleDetail} onOpen={canFillDevotion ? openBible : undefined}
        action={canFillDevotion && !bibleDone && plan && reading
          ? <button type="button" className={styles.quick} disabled={pending} onClick={tickBible} aria-label={`Done: I read ${reading.label}`}><CheckIcon className="size-3.5" strokeWidth={2.6} aria-hidden="true" />Done</button>
          : undefined} />
      <Row tick={prayerDone} title="Prayer Watch" detail={prayerLine ? capitalise(prayerLine) : "Not recorded"} onOpen={canFillDevotion ? () => open("prayerWatch") : undefined} />
      <Row tick={teachingDone} title="Teaching" detail={teachingDetail} onOpen={writable ? () => open("teaching") : undefined} />
    </Card>

    <Card icon={<HeartHandshakeIcon className="size-4" strokeWidth={2} />} tone={["#dcefe3", "#1f6b45"]} title="Ministry"
      status={statusFor("ministry").label} statusTone={statusFor("ministry").tone}>
      {ministry.length ? <ul className={styles.saved}>{ministry.map(activity => <ActivityCard key={activity.id} activity={activity} today={today} canChange={writable && !preview} onEdit={inline && edits[activity.id] ? () => setEditing(edits[activity.id]) : undefined} />)}</ul> : null}
      {inline || !writable ? <>{partRow("evangelism")}{partRow("discipleship")}</>
        : <Row title="Log ministry" detail="Evangelism or discipleship" href={`${addHref}&category=ministry`} end={<AddLabel />} />}
    </Card>

    <Card icon={<UsersRoundIcon className="size-4" strokeWidth={2} />} tone={["#f6d9de", "#7a2e45"]} title="Meetings"
      status={statusFor("meetings").label} statusTone={statusFor("meetings").tone}>
      {meetings.filter(activity => !detailOf(activity.id) && activity.kind !== "outreach_meeting").length
        ? <ul className={styles.saved}>{meetings.filter(activity => !detailOf(activity.id) && activity.kind !== "outreach_meeting").map(activity => <ActivityCard key={activity.id} activity={activity} meetingDetails={meetingDetails.find(row => row.activityId === activity.id)} today={today} canChange={writable && !preview} />)}</ul> : null}
      {meetings.filter(activity => detailOf(activity.id) || activity.kind === "outreach_meeting").map(activity => {
        const detail = detailOf(activity.id);
        return <div key={activity.id} className={styles.row}>
          <span className={styles.rowCopy} style={{ padding: "8px 0 8px 14px" }}>
            <span className={styles.rowTitle}>{MEETING_KIND_LABEL[activity.kind] ?? "Meeting"}{detail ? detail.role === "led" ? " · you led it" : " · you attended" : ""}</span>
            <span className={styles.rowDetail} style={{ whiteSpace: "normal" }}>{detail ? meetingLine({ ...detail, brought: detail.peopleBrought, emphasis: activity.title, venue: activity.location }) : ministryLine ?? "From your ministry"}</span>
          </span>
          {writable && !preview ? <button type="button" className={styles.quiet} style={{ marginRight: 14 }} disabled={pending} onClick={() => run(() => deleteMinistryActivity(activity.id))}>Remove</button> : null}
        </div>;
      })}
      {drafts.map(draft => <div key={draft.id} className={styles.row}>
        <span className={styles.rowCopy} style={{ padding: "8px 14px" }}>
          <span className={styles.rowTitle}>{MEETING_LABEL[draft.kind]}{draft.kind === "outreach" ? "" : draft.led ? " · you led it" : " · you attended"}</span>
          <span className={styles.rowDetail}>{preview ? draft.summary : `Saving… ${draft.summary}`}</span>
        </span>
      </div>)}
      {meetings.length || drafts.length
        ? writable ? <Row title="Add another meeting" detail="Teaching, prayer or outreach" onOpen={() => open("meeting")} end={<AddLabel />} /> : null
        : reasonOf("meetings") || statuses.meetings === "nil"
          ? <NoRow title="Meetings" reason={reasonOf("meetings") ?? `Nothing ${dayWord}`} onOpen={writable ? () => setNoSheet("meetings") : undefined} />
          : writable ? <YesNoRow title={`Did you attend a meeting ${dayWord}?`} question="Teaching, prayer or outreach" onNo={() => setNoSheet("meetings")} onYes={() => open("meeting")} />
          : <Row title="Meetings" detail="Not answered" />}
    </Card>

    {/* Other reports (Pastor, 20 October): optional, never part of the daily report. */}
    {assignment ? <section className={styles.card} aria-label="Other reports">
      <div className={styles.cardHead}>
        <span className={styles.icon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><TargetIcon className="size-4" strokeWidth={2} /></span>
        <h2 className={styles.title}>Other reports</h2>
        <Pill tone="nil">Optional</Pill>
      </div>
      <Row title="Natural assignment" href={`/dashboard/community/report/assignment${selected === today ? "" : `?day=${selected}`}`}
        detail={assignment.goals ? `${assignment.goals === 1 ? "1 goal" : `${assignment.goals} goals`} · ${assignment.done} of ${assignment.todos} to-dos done` : "Your goals, to-dos and deadlines for the day"} />
    </section> : null}

    {writable ? <p className={styles.meta}>You can report for today and the past 7 days. We’ll remind you at 8 pm if anything’s missing.</p> : null}

    {writable && enabled ? <div className={styles.bar} data-floating="">
      {submitted
        ? <div className={styles.submitted}><CheckIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />Report submitted for {dayWord}. Add or change anything above.</div>
        : <>
          <span className={styles.barMeta}>{allAnswered ? `${readyCount} of 3 sections ready` : "Answer Yes or No for each part"}</span>
          <button type="button" className={styles.submit} disabled={pending || !allAnswered} onClick={() => setReview("open")}>Review and submit</button>
        </>}
    </div> : null}

    {popup === "biblePlan" ? <BiblePlanSheet dateKey={selected} plan={plan} onClose={close} /> : null}
    {popup === "bibleToday" ? plan && reading && bibleDay
      ? <BibleTodaySheet dateKey={selected} day={{ ...bibleDay, plan, reading }} onClose={close} onChangePlan={() => open("biblePlan")} onOptimistic={optimisticSave} />
      : <BibleFreeSheet dateKey={selected} initial={bibleLogged} onClose={close} /> : null}
    {popup === "prayerWatch" ? <PrayerWatchSheet dateKey={selected} attended={shown.prayer ?? devotion?.prayerWatch ?? []} times={shown.times ?? devotion?.prayerTimes ?? []} onClose={close} onChange={(sessions, times) => setOverride({ ...shown, prayer: sessions, times, date: selected })} /> : null}
    {popup === "teaching" ? <TeachingSheet dateKey={selected} sogp={sogpDetail} podcast={podcastDetail} report={teaching} available={popupsReady} onClose={close} onOptimistic={optimisticSave} /> : null}
    {popup === "evangelism" ? <EvangelismSheet dateKey={selected} contacts={contacts} onClose={close} /> : null}
    {popup === "discipleship" ? <DiscipleshipSheet dateKey={selected} contacts={contacts} teachings={teachings} onClose={close} /> : null}
    {editing?.kind === "outreach" ? <EvangelismSheet key={editing.activityId} dateKey={selected} contacts={contacts} initial={editing} onClose={() => setEditing(null)} /> : null}
    {editing?.kind === "follow_up" ? <DiscipleshipSheet key={editing.activityId} dateKey={selected} contacts={contacts} teachings={teachings} initial={editing} onClose={() => setEditing(null)} /> : null}
    {popup === "meeting" ? <MeetingSheet venues={venues} ministry={ministryLine} onSave={addMeeting} onClose={close} /> : null}
    {noSheet ? <ReasonSheet key={noSheet} part={noSheet} initial={reasonOf(noSheet) ?? undefined} onSave={reason => answerNo(noSheet, reason)}
      onYes={() => { const part = noSheet; setNoSheet(null); open(part === "meetings" ? "meeting" : part); }} onClose={() => setNoSheet(null)} /> : null}

    {review ? <div className={styles.shade} data-closing={review === "closing" || undefined} role="presentation" onClick={event => { if (event.target === event.currentTarget) closeReview(); }}>
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="report-review-title">
        <span className={styles.grab} aria-hidden="true" />
        <h2 id="report-review-title" data-dashboard-shell-title>Your report for {selected === today ? "today" : weekday.format(new Date(`${selected}T00:00:00Z`))}</h2>
        <p className={styles.meta}>Check it, then send it to your oversight.</p>
        <div className={styles.review}>
          <b>Devotion</b>
          <p>{devotionDone ? [bibleDone ? `Bible reading (${bibleDetail})` : null, prayerDone ? `Prayer Watch (${prayerLine})` : null, teachingDone ? `Teaching (${teachingDetail})` : null].filter(Boolean).join(" · ") : `No Bible reading, Prayer Watch or teaching logged ${dayWord}.`}</p>
        </div>
        <div className={styles.review}>
          <b>Ministry</b>
          <p>{[...ministry.map(activityLine), ...(["evangelism", "discipleship"] as const).flatMap(part => reasonOf(part) ? [`No ${part}: ${reasonOf(part)}`] : [])].join(". ") || `Nothing ${dayWord}`}</p>
        </div>
        <div className={styles.review}>
          <b>Meetings</b>
          <p>{meetings.length ? meetings.map(activityLine).join(". ") : reasonOf("meetings") ? `No meeting: ${reasonOf("meetings")}` : `Nothing ${dayWord}`}</p>
        </div>
        <div className={styles.sheetActions}>
          <button type="button" className={styles.submit} disabled={pending} onClick={submit}>{pending ? "Submitting…" : "Confirm and submit"}</button>
          <button type="button" className={styles.secondary} disabled={pending} onClick={closeReview}>Edit</button>
        </div>
      </div>
    </div> : null}
  </div>;
}
