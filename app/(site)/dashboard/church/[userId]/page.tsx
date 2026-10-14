import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";
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
import { compactButton, focusRing } from "@/components/dashboard/shell/styles";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { ChurchReminderButton } from "@/components/dashboard/church/reminder-button";

export default async function ChurchReportPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ day?: string }> }) {
  const session = await getAppSession(); if (!session) redirect("/login?returnTo=/dashboard/church");
  const { userId } = await params; const today = lagosToday(); const { day } = await searchParams;
  const selected = isDateKey(day) && day <= today ? day : today;
  try { await requireChurchReportAccess(session.user.id, userId); } catch (error) { if (error instanceof CommunityError) notFound(); throw error; }
  const [[person], report] = await Promise.all([db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1), getChurchReport(session.user.id, userId, selected)]);
  if (!person) notFound();
  return <div className="mx-auto grid max-w-3xl gap-5 p-4 sm:p-6"><Link href="/dashboard/church/reports" className={`inline-flex w-fit items-center gap-1.5 rounded-sm text-[12.5px] font-medium text-(--color-brand-blue) hover:underline ${focusRing}`}><ArrowLeftIcon className="size-4" aria-hidden />Back to oversight</Link><header className="grid gap-1"><h1 className="font-medium">{person.name}</h1><p className="text-[12px] text-(--color-text-muted)">{dateKeyLabel(selected)}</p></header>
    <nav aria-label="Report date" className="flex gap-2"><Link className={compactButton} href={`?day=${shiftDate(selected, -1)}`}>Previous day</Link>{selected < today ? <Link className={compactButton} href={`?day=${shiftDate(selected, 1)}`}>Next day</Link> : null}</nav>
    <dl className="grid gap-2 rounded-xl border border-(--color-line) p-4">{Object.entries(report.statuses).map(([key, value]) => <div key={key} className="flex justify-between gap-3 text-[13px]"><dt className="capitalize">{key}</dt><dd>{value === "missing" ? "Not yet" : value === "nil" ? "Nil" : "Reported"}</dd></div>)}</dl>
    <section className="grid gap-2 rounded-xl border border-(--color-line) p-4"><h2 className="font-medium">Devotional activity</h2><ul className="grid gap-2 text-[13px]">{report.devotion.map((line) => <li key={line.key}>{line.label} · {line.detail ?? "not recorded"}</li>)}</ul></section>
    <section className="grid gap-3"><h2 className="font-medium">Recorded activities</h2>{report.activities.length ? report.activities.map((row) => <article key={row.id} className="grid gap-2 rounded-xl border border-(--color-line) p-4"><h3 className="font-medium">{row.title || activityKindLabel(row.kind)}</h3>{row.location || row.platform ? <p className="text-[12px] text-(--color-text-muted)">{[row.platform, row.location].filter(Boolean).join(" · ")}</p> : null}<dl className="grid grid-cols-2 gap-2 text-[13px]">{MINISTRY_FIELDS.filter(({ key }) => Number(row.numbers[key]) > 0).map(({ key, label }) => <div key={key}><dt className="text-(--color-text-muted)">{label}</dt><dd>{row.numbers[key]}</dd></div>)}</dl>{row.meeting ? <p className="text-[13px] capitalize">{row.meeting.reportingRole}</p> : null}{row.meeting?.taught ? <p className="whitespace-pre-wrap text-[13px]">{row.meeting.taught}</p> : null}</article>) : <p className="text-[13px] text-(--color-text-muted)">No activities recorded.</p>}</section>
    <ChurchReminderButton subjectId={userId} day={selected} enabled={reportRemindersEnabled()} />
  </div>;
}
