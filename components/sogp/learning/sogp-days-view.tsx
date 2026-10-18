import Link from "next/link";

import { sogpDayWeeks, type SogpDay, type SogpDaysPlan } from "@/lib/sogp/sogp-days";

import styles from "./sogp-days.module.css";

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const formatKey = (key: string) => dateFormat.format(new Date(`${key}T00:00:00.000Z`));

function DayCell({ day }: { day: SogpDay }) {
  const state = day.complete ? "complete" : day.isToday ? "today" : day.past ? "past" : "future";
  const parts = day.kind === "teaching"
    ? `Prayer Watch ${day.prayer ? "done" : "not done"}, teaching ${day.teaching ? "done" : "not done"}, assessment ${day.assessment ? "done" : "not done"}`
    : day.complete ? "review done" : "review";
  const body = <>
    <b>{day.kind === "review" ? day.label : day.number}</b>
    {day.kind === "teaching"
      ? <span className={styles.trio} aria-hidden="true"><i data-on={day.prayer || undefined} data-part="p" /><i data-on={day.teaching || undefined} data-part="t" /><i data-on={day.assessment || undefined} data-part="a" /></span>
      : <small aria-hidden="true">Review</small>}
  </>;
  const label = `${day.kind === "review" ? `Review day ${day.label.slice(1)}` : day.label}, ${formatKey(day.dateKey)}: ${day.title}. ${parts}`;
  return day.href && day.open
    ? <Link href={day.href} className={styles.cell} data-kind={day.kind} data-state={state} aria-label={label} aria-current={day.isToday ? "date" : undefined}>{body}</Link>
    : <div className={styles.cell} data-kind={day.kind} data-state={state} aria-label={label} role="img">{body}</div>;
}

/**
 * Your SOGP days (user decision, 18 October): the traditional path's 24
 * teaching days and its review days numbered as one run from the first day,
 * each teaching day showing its Prayer Watch, teaching and assessment.
 */
export function SogpDaysView({ plan }: { plan: SogpDaysPlan }) {
  const weeks = sogpDayWeeks(plan.days);
  const current = plan.current;
  const waiting = plan.days.filter(day => day.kind === "teaching" && day.past && day.open && !day.assessment);
  return <div className={styles.page}>
    <header>
      <h1>Your {plan.days.length} days of SOGP</h1>
      <p className={styles.sub}>{plan.teachingDays} teaching days and {plan.reviewDays} review {plan.reviewDays === 1 ? "day" : "days"}</p>
    </header>

    {plan.startKey && plan.endKey ? <div className={styles.summary}>
      <span>{current ? "Started" : "Starts"} <b>{formatKey(plan.startKey)}</b></span>
      <span>Last day <b>{formatKey(plan.endKey)}</b></span>
    </div> : null}

    <div className={styles.legend} aria-hidden="true">
      <span><i data-part="p" />Prayer Watch</span><span><i data-part="t" />Teaching</span><span><i data-part="a" />Assessment</span>
    </div>

    {weeks.map((week, index) => <section key={week[0]!.dateKey} aria-label={`Week ${index + 1}`}>
      <h2 className={styles.week}>Week {index + 1}</h2>
      <div className={styles.grid}>{week.map(day => <DayCell key={day.dateKey} day={day} />)}</div>
    </section>)}

    <p className={styles.hint}>
      {current ? `You’re on ${current.kind === "review" ? `review day ${current.label.slice(1)}` : current.label.toLowerCase()}. ` : ""}
      {waiting.length
        ? `${waiting.length === 1 ? `${waiting[0]!.label}’s teaching is` : `${waiting.length} earlier teachings are`} still waiting. You can do ${waiting.length === 1 ? "it" : "them"} any time; ${waiting.length === 1 ? "it never blocks" : "they never block"} today’s.`
        : "Open any day that’s ready to see its teaching and assessment."}
    </p>
  </div>;
}
