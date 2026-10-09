import Link from "next/link";

import { activityKindLabel } from "@/lib/community/ministry-activities";
import { totalReached, type MinistryNumbers } from "@/lib/community/ministry-report";
import { dateKeyLabel } from "@/lib/community/time";
import type {
  DayActivitySummary,
  MemberActivity,
} from "@/lib/db/queries/ministry-activities";

import { dayHref } from "./day-picker";
import { ReportTabs } from "./report-tabs";
import { card } from "./styles";

export type HistoryDay = {
  dateKey: string;
  activities: MemberActivity[];
  activity: DayActivitySummary;
};

type Period = { count: number; totals: MinistryNumbers };

function Totals({ title, period }: { title: string; period: Period }) {
  const figures = [
    { label: "Activities", value: period.count },
    { label: "Reached", value: totalReached(period.totals) },
    { label: "Saved", value: period.totals.saved },
    { label: "Filled", value: period.totals.filled },
    { label: "Healed", value: period.totals.healed },
    { label: "Follow-ups", value: period.totals.followUps },
  ];
  return (
    <div className={`${card} grid gap-2 p-4`}>
      <p className="text-xs font-medium text-zinc-500">{title}</p>
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {figures.map((figure) => (
          <div key={figure.label} className="grid gap-0.5">
            <dd className="ppc-heading text-base font-semibold text-zinc-900">
              {figure.value}
            </dd>
            <dt className="text-[0.7rem] text-zinc-500">{figure.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Dot({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      title={label}
      aria-label={`${label}: ${on ? "done" : "not recorded"}`}
      className={`inline-block size-2 rounded-full ${
        on ? "bg-(--color-brand-blue)" : "bg-zinc-200"
      }`}
    />
  );
}

/** The kinds logged that day, e.g. "evangelism, prayer meeting". */
function kindsOf(activities: MemberActivity[]): string {
  const seen = new Set<string>();
  for (const activity of activities) seen.add(activityKindLabel(activity.kind).toLowerCase());
  return [...seen].join(", ");
}

/** The History tab: recent totals and the last two weeks day by day. */
export function ReportHistoryView({
  today,
  reportable,
  days,
  week,
  month,
}: {
  today: string;
  /** Days still open for changes; these link back to the Report tab. */
  reportable: string[];
  days: HistoryDay[];
  week: Period;
  month: Period;
}) {
  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">Daily report</h1>
        <p className="max-w-md text-sm text-zinc-500">
          Your recent activities added up, and each of your last {days.length} days.
        </p>
      </header>

      <ReportTabs active="history" />

      <div className="grid gap-3 sm:grid-cols-2">
        <Totals title="Last 7 days" period={week} />
        <Totals title="This month" period={month} />
      </div>

      <section className={`${card} overflow-hidden`}>
        <h2 className="ppc-heading border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
          Your last {days.length} days
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-2 font-medium">Day</th>
                <th className="px-2 py-2 font-medium">Activities</th>
                <th className="px-2 py-2 text-right font-medium">Reached</th>
                <th className="px-2 py-2 text-right font-medium">Saved</th>
                <th className="px-2 py-2 text-right font-medium">Follow-ups</th>
                <th className="px-4 py-2 font-medium">Pleros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {days.map((day) => {
                const totals =
                  day.activities.length > 0
                    ? day.activities.reduce(
                        (sum, activity) => ({
                          reached: sum.reached + totalReached(activity),
                          saved: sum.saved + activity.saved,
                          followUps: sum.followUps + activity.followUps,
                        }),
                        { reached: 0, saved: 0, followUps: 0 },
                      )
                    : null;
                const open = reportable.includes(day.dateKey);
                return (
                  <tr key={day.dateKey} className={totals ? "" : "text-zinc-400"}>
                    <td className="whitespace-nowrap px-4 py-2 font-medium text-zinc-900">
                      {open ? (
                        <Link
                          href={dayHref(day.dateKey, today)}
                          className="text-(--color-brand-blue) underline underline-offset-2"
                        >
                          {dateKeyLabel(day.dateKey)}
                        </Link>
                      ) : (
                        dateKeyLabel(day.dateKey)
                      )}
                    </td>
                    <td className="px-2 py-2 text-zinc-700">
                      {totals ? (
                        <>
                          {day.activities.length}
                          <span className="text-xs text-zinc-500"> · {kindsOf(day.activities)}</span>
                        </>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{totals?.reached ?? "–"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{totals?.saved ?? "–"}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{totals?.followUps ?? "–"}</td>
                    <td className="px-4 py-2">
                      <span className="flex items-center gap-1.5">
                        <Dot on={day.activity.bible} label="Bible reading" />
                        <Dot on={day.activity.prayerWatch} label="Prayer Watch" />
                        {day.activity.sogp == null ? null : (
                          <Dot on={day.activity.sogp} label="SOGP" />
                        )}
                        <Dot on={day.activity.podcastEpisodes > 0} label="Podcast" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
          Dots show Bible reading, Prayer Watch, SOGP (when you are in a cohort)
          and podcast for each day.
        </p>
      </section>
    </div>
  );
}
