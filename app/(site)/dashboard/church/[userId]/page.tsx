import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getChurchReport } from "@/lib/db/queries/church-reports";
import { requireChurchReportAccess } from "@/lib/db/queries/church-organisation";
import { CommunityError } from "@/lib/community/errors";
import { isDateKey, MINISTRY_FIELDS } from "@/lib/community/ministry-report";
import { activityKindLabel } from "@/lib/community/ministry-activities";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";
import { dateKeyLabel } from "@/lib/community/time";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import styles from "@/components/community/discipleship/discipleship-group.module.css";
import forms from "@/components/dashboard/church/church-forms.module.css";
import { ChurchHeading, ChurchPage } from "@/components/dashboard/church/church-ui";
import { Mark, short, Strip } from "@/components/dashboard/church/oversight-view";
import { ChurchReminderButton } from "@/components/dashboard/church/reminder-button";

// Reads the session on every request (Cache Components).
export const instant = false;

const STATUS_LABELS = { devotional: "Devotional", ministry: "Ministry", meetings: "Meetings" } as Record<string, string>;
const statusText = (value: string) => value === "missing" ? "Not yet" : value === "nil" ? "Nil" : "Reported";

export default async function ChurchReportPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ day?: string }> }) {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/church");
  const { userId } = await params; const today = lagosToday(); const { day } = await searchParams;
  const selected = isDateKey(day) && day <= today ? day : today;
  try { await requireChurchReportAccess(session.user.id, userId); } catch (error) { if (error instanceof CommunityError) notFound(); throw error; }
  const [[person], report] = await Promise.all([db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1), getChurchReport(session.user.id, userId, selected)]);
  if (!person) notFound();
  return <ChurchPage>
    <ChurchHeading title={person.name} sub={`${selected === today ? "Today · " : ""}${dateKeyLabel(selected)}`} />
    <nav aria-label="Report date" className="flex items-center justify-between gap-2">
      <Link className={styles.btn} href={`?day=${shiftDate(selected, -1)}`}><ChevronLeftIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Previous day</Link>
      {selected < today ? <Link className={styles.btn} href={`?day=${shiftDate(selected, 1)}`}>Next day<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link> : null}
    </nav>
    <Strip items={Object.entries(report.statuses).map(([key, value]) => [STATUS_LABELS[key] ?? key, statusText(value), value === "missing"])} />

    <div className={styles.sectionTitle}><h2>Devotional activity</h2></div>
    <div className={styles.panel}>{report.devotion.map(line => <div key={line.key} className={styles.kv}><span>{line.label}</span><b style={line.detail ? undefined : { color: "var(--color-community-muted)", fontWeight: 400 }}>{line.detail ?? "Not recorded"}</b></div>)}</div>

    <div className={styles.sectionTitle}><h2>Recorded activities</h2><span className={styles.rowMeta}>{report.activities.length}</span></div>
    {report.activities.length ? report.activities.map((row, index) => {
      const numbers = MINISTRY_FIELDS.filter(({ key }) => Number(row.numbers[key]) > 0);
      const title = row.title || activityKindLabel(row.kind);
      const meta = [activityKindLabel(row.kind), row.platform, row.location, row.meeting ? `As ${row.meeting.reportingRole}` : null].filter(Boolean).join(" · ");
      return <article key={row.id} className={styles.panel}>
        <div className={styles.row}>
          <Mark text={short(title)} index={index} />
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowMeta}>{meta}</span></span>
        </div>
        {numbers.length ? <dl className={forms.numbers}>{numbers.map(({ key, label }) => <div key={key}><dt>{label}</dt><dd>{row.numbers[key]}</dd></div>)}</dl> : null}
        {row.meeting?.taught ? <p className={forms.taught}>{row.meeting.taught}</p> : null}
      </article>;
    }) : <p className={`${styles.panel} ${styles.empty}`}>No activities recorded.</p>}
    <ChurchReminderButton subjectId={userId} day={selected} enabled={reportRemindersEnabled()} />
  </ChurchPage>;
}
