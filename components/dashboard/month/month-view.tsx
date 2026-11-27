import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";

import group from "@/components/community/discipleship/discipleship-group.module.css";
import { monthCarryNote, type MonthCalendarData } from "@/lib/dashboard/month-data";

import { MonthCalendar } from "./month-calendar";
import styles from "./month-calendar.module.css";

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * The month page (Pastor, 25 November 2026): the month's counts, the whole
 * month, and the rest of your plan, dated to the month's end. Opened from
 * Home's calendar, Your path and the SOGP page.
 */
export function MonthView({ data }: { data: MonthCalendarData }) {
  const { month } = data;
  const first = month.daysSoFar === 1;
  const note = monthCarryNote(data);
  return <section className={styles.page}>
    <header>
      <h1>{month.name}</h1>
      <p className={group.sub}>Your plan and what you did · {first ? "a new month" : month.daysLeft === 1 ? "last day" : `${month.daysLeft} days left`}</p>
    </header>

    <div className={group.strip}>
      <div><span>Days learnt</span><strong>{data.counts.learnt}</strong></div>
      <div><span>Prayer Watch</span><strong>{data.counts.prayer}</strong></div>
      <div><span>Days read</span><strong>{data.counts.bible}</strong></div>
    </div>

    <div className={`${group.panel} ${styles.calendarPanel}`}>
      <MonthCalendar monthKey={month.key} todayKey={data.todayKey} days={data.days} podcast={data.podcast} legend selectToday />
    </div>

    <div className={group.sectionTitle}>
      <h2>{first ? `Your ${month.name} plan` : `Rest of ${month.name}`}</h2>
      {data.rest.length ? <span className={group.rowMeta}>{plural(data.rest.length, "day")}</span> : null}
    </div>
    <div className={group.panel}>{data.rest.length ? <ul className={group.list}>{data.rest.map(({ dateKey, item }) => {
      const body = <>
        <span className={group.rowCopy}><span className={group.rowTitle}>{item.title}</span><span className={group.rowMeta}>{item.meta}</span></span>
        <span className={group.rowMeta}>{dateKey === data.todayKey ? "Today" : dayMonth.format(new Date(`${dateKey}T00:00:00.000Z`))}</span>
        {item.href ? <ChevronRightIcon className={`${group.chev} size-4`} strokeWidth={2} aria-hidden="true" /> : null}
      </>;
      return <li key={dateKey}>{item.href ? <Link href={item.href} className={group.row}>{body}</Link> : <div className={group.row}>{body}</div>}</li>;
    })}</ul> : <p className={group.empty}>{data.path ? "Nothing planned for the rest of the month. Choose what’s next on Learning." : "Choose your SOGP path and your plan for the month appears here."}</p>}</div>

    <p className={group.note}>{note ? `${note} ` : ""}An unfinished day is never lost: it moves to the next.</p>
    {data.path ? null : <Link href="/dashboard/sogp/path" className={`${group.quiet} inline-flex items-center gap-0.5 justify-self-start`}>Choose your SOGP path<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>}
  </section>;
}
