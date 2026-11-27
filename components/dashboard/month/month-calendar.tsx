"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BookOpenIcon, CheckIcon, ChevronDownIcon, ClockIcon, HeadphonesIcon } from "lucide-react";

import { monthWeeks, type CalendarDay } from "@/lib/learning/month-calendar";

import styles from "./month-calendar.module.css";

type DayState = "before" | "past" | "today" | "later";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const longDate = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });
const formatKey = (key: string) => longDate.format(new Date(`${key}T00:00:00.000Z`));
const times = (count: number) => `${count} ${count === 1 ? "time" : "times"}`;

function stateOf(key: string, todayKey: string, startKey?: string): DayState {
  if (startKey && key < startKey) return "before";
  return key < todayKey ? "past" : key === todayKey ? "today" : "later";
}

function describe(key: string, state: DayState, day: CalendarDay | undefined) {
  const date = `${state === "today" ? "Today, " : ""}${formatKey(key)}`;
  if (state === "before") return `${date}: before you joined`;
  if (state === "later") return `${date}: ${day?.learning ? `planned, ${day.learning.title}, ${day.learning.meta}` : "nothing planned"}`;
  return `${date}: ${day?.learning?.done ? "learnt" : "no learning yet"}, ${day?.prayer ? `Prayer Watch ${times(day.prayer)}` : "no Prayer Watch"}, ${day?.bible ? "Bible read" : "no Bible reading"}`;
}

function Line({ icon, title, detail, done, href }: { icon: ReactNode; title: string; detail: string; done?: boolean; href?: string | null }) {
  return <div className={styles.line}>
    {icon}
    <span className={styles.lineCopy}>{href ? <Link href={href} className={styles.lineLink}>{title}</Link> : <span>{title}</span>}<span>{detail}</span></span>
    {done ? <span className={styles.check} aria-label="Done"><CheckIcon className="size-3" strokeWidth={3} aria-hidden="true" /></span> : null}
  </div>;
}

/** One day, opened from the calendar: what you did, or what's planned. */
function DayDetail({ dateKey, state, day, podcast }: { dateKey: string; state: DayState; day: CalendarDay | undefined; podcast: boolean }) {
  const learningIcon = podcast ? <HeadphonesIcon aria-hidden="true" /> : <BookOpenIcon aria-hidden="true" />;
  return <div className={styles.detail}>
    <p className={styles.detailDate}>{state === "today" ? "Today · " : state === "later" ? "Planned · " : ""}{formatKey(dateKey)}</p>
    <Line icon={learningIcon} title={day?.learning?.title ?? "Learning"} detail={day?.learning?.meta ?? (state === "later" ? "Nothing planned" : "Nothing recorded")} done={day?.learning?.done} href={day?.learning?.href} />
    {state === "later" ? null : <>
      <Line icon={<ClockIcon aria-hidden="true" />} title="Prayer Watch" detail={day?.prayer ? times(day.prayer) : "Not recorded"} done={Boolean(day?.prayer)} />
      <Line icon={<BookOpenIcon aria-hidden="true" />} title="Bible reading" detail={day?.bible ? "Read" : "Not recorded"} done={day?.bible} />
    </>}
  </div>;
}

/**
 * The shared month (Pastor, 25 November 2026): everyone sees the same calendar
 * month. Past days show what you did (learning fills the day; Prayer Watch and
 * Bible reading are the two dots under it); today and later show your plan.
 * Home folds it to this week; the month page shows it whole.
 */
export function MonthCalendar({ monthKey, todayKey, days, startKey, collapsible = false, legend = false, selectToday = false, podcast = true }: {
  /** "2026-11" */
  monthKey: string;
  todayKey: string;
  days: Record<string, CalendarDay>;
  /** Days before this (when you joined) are blank. */
  startKey?: string;
  /** Home: this week only, with the month a tap away. */
  collapsible?: boolean;
  legend?: boolean;
  /** Open today's detail to begin with (the month page). */
  selectToday?: boolean;
  podcast?: boolean;
}) {
  const weeks = monthWeeks(monthKey);
  const [open, setOpen] = useState(!collapsible);
  const [selected, setSelected] = useState<string | null>(selectToday ? todayKey : null);
  // The last day opened stays mounted while its detail folds away.
  const [shown, setShown] = useState<string | null>(selected);
  const name = monthName.format(new Date(`${monthKey}-01T00:00:00.000Z`));
  const currentWeek = Math.max(0, weeks.findIndex(week => week.includes(todayKey)));

  function choose(key: string) {
    if (selected === key) { setSelected(null); return; }
    setSelected(key);
    setShown(key);
  }

  return <div className={styles.calendar}>
    <div className={styles.weekdays} aria-hidden="true">{WEEKDAYS.map(day => <span key={day}>{day}</span>)}</div>
    {weeks.map((week, index) => <div key={week.find(Boolean)} className={styles.fold} data-open={open || index === currentWeek || undefined} inert={!(open || index === currentWeek) || undefined}>
      <div>
        <ol className={styles.week} aria-label={`${name}, week ${index + 1}`}>
          {week.map((key, column) => {
            if (!key) return <li key={`blank-${column}`} aria-hidden="true" />;
            const state = stateOf(key, todayKey, startKey);
            const day = days[key];
            return <li key={key}>
              <button
                type="button"
                className={styles.day}
                data-state={state}
                data-learnt={(state !== "later" && day?.learning?.done) || undefined}
                aria-pressed={selected === key}
                aria-current={state === "today" ? "date" : undefined}
                aria-label={describe(key, state, day)}
                disabled={state === "before"}
                onClick={() => choose(key)}
              >
                <b>{Number(key.slice(8))}</b>
                <span className={styles.marks} aria-hidden="true"><i data-on={day?.prayer ? "" : undefined} /><i data-on={day?.bible ? "" : undefined} /></span>
              </button>
            </li>;
          })}
        </ol>
      </div>
    </div>)}

    {collapsible ? <button type="button" className={styles.more} aria-expanded={open} onClick={() => setOpen(value => !value)}>
      {open ? "Show this week only" : `See all of ${name}`}<ChevronDownIcon className="size-4" strokeWidth={2.2} aria-hidden="true" />
    </button> : null}

    {legend ? <p className={styles.legend} aria-hidden="true">
      <span><i className={styles.legendDay} />Learnt</span>
      <span><span className={styles.marks}><i data-on="" /><i /></span>Prayer Watch</span>
      <span><span className={styles.marks}><i /><i data-on="" /></span>Bible reading</span>
    </p> : null}

    <div className={styles.detailFold} data-open={selected ? "" : undefined} aria-live="polite">
      <div>{shown ? <DayDetail key={shown} dateKey={shown} state={stateOf(shown, todayKey, startKey)} day={days[shown]} podcast={podcast} /> : null}</div>
    </div>
  </div>;
}
