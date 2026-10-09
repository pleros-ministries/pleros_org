import Link from "next/link";
import { CheckIcon, PlusIcon } from "lucide-react";

import type { ActivityLine } from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";

import { ActivityCard } from "./activity-card";
import { DayPicker, dayName } from "./day-picker";
import { PlerosTodayStrip } from "./pleros-today-strip";
import { ReportTabs } from "./report-tabs";
import { card, outlineButton, primaryButton } from "./styles";

/**
 * The Report tab: the activities a member logged for one day, a way to add
 * another, and what Pleros already recorded for that day.
 */
export function ReportDayView({
  today,
  days,
  selected,
  activities,
  pleros,
  flash,
}: {
  today: string;
  /** The days that can still be reported, today first. */
  days: string[];
  selected: string;
  activities: MemberActivity[];
  pleros: ActivityLine[];
  flash: "saved" | "removed" | null;
}) {
  const addHref = `/dashboard/community/report/new${
    selected === today ? "" : `?day=${selected}`
  }`;
  const count = activities.length;

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">Daily report</h1>
        <p className="max-w-md text-sm text-zinc-500">
          Log what you did each day: evangelism, discipleship, meetings. The Pleros
          team, your pastor and your discipler see your numbers; only the Pleros
          team and your pastor see your notes and the people you add.
        </p>
      </header>

      <ReportTabs active="report" />

      <DayPicker today={today} days={days} selected={selected} />

      {flash ? (
        <p
          role="status"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-emerald-700"
        >
          <CheckIcon className="size-4" strokeWidth={2} />
          {flash === "saved" ? "Activity saved." : "Activity removed."}
        </p>
      ) : null}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          {dateKeyLabel(selected)}
        </h2>
        <p className="text-xs text-zinc-500">
          {count === 0
            ? "Nothing logged yet"
            : `${count} ${count === 1 ? "activity" : "activities"} logged`}
        </p>
      </div>

      {count === 0 ? (
        <section className={`${card} grid justify-items-center gap-3 p-6 text-center`}>
          <div className="grid gap-1">
            <p className="text-sm font-medium text-zinc-900">
              Nothing logged for {dayName(selected, today).toLowerCase()} yet.
            </p>
            <p className="max-w-xs text-sm text-zinc-500">
              Add each thing you did: evangelism, discipleship, a meeting.
            </p>
          </div>
          <Link href={addHref} className={primaryButton}>
            <PlusIcon className="size-4" strokeWidth={2} />
            Add an activity
          </Link>
        </section>
      ) : (
        <>
          <ul className="grid gap-3">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                today={today}
                canChange={days.includes(selected)}
              />
            ))}
          </ul>
          <Link href={addHref} className={`${outlineButton} w-fit`}>
            <PlusIcon className="size-4" strokeWidth={2} />
            Add another activity
          </Link>
        </>
      )}

      <PlerosTodayStrip dateKey={selected} today={today} lines={pleros} />
    </div>
  );
}
