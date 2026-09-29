import { Mark } from "@/components/ppc/admin-sogp-daily-by-pastor";
import type { EnrolleePerformanceDay } from "@/lib/db/queries/sogp-daily";

function formatDay(dateKey: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00Z`));
}

function scoreTone(percent: number) {
  if (percent >= 80) return "text-emerald-700";
  if (percent >= 40) return "text-amber-700";
  return "text-rose-700";
}

function Score({ day, isToday }: { day: EnrolleePerformanceDay; isToday: boolean }) {
  if (day.applicable === 0) return <span className="text-zinc-300">—</span>;
  const percent = Math.round((day.completed / day.applicable) * 100);
  return (
    <span className={`font-medium ${isToday ? "text-zinc-700" : scoreTone(percent)}`}>
      {day.completed}/{day.applicable}
      <span className="ml-1 text-[10px] font-normal text-zinc-500">({percent}%)</span>
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="grid gap-0.5 rounded-sm border border-zinc-200 bg-white p-3">
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        {label}
      </span>
      <span className="ppc-heading text-base font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

/** Summary stats plus a day-by-day table of one enrollee's SOGP activity. */
export function EnrolleeDailyPerformance({
  days,
  todayKey,
}: {
  days: EnrolleePerformanceDay[];
  todayKey: string;
}) {
  const scored = days.filter((day) => day.applicable > 0);
  const completed = scored.reduce((sum, day) => sum + day.completed, 0);
  const applicable = scored.reduce((sum, day) => sum + day.applicable, 0);
  const average = applicable ? `${Math.round((completed / applicable) * 100)}%` : "—";

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Days active" value={`${scored.filter((day) => day.completed > 0).length}/${scored.length}`} />
        <Stat label="Average daily score" value={average} />
        <Stat label="Morning prayer" value={`${days.filter((day) => day.prayerWatch).length}d`} />
        <Stat label="Reviews attended" value={days.filter((day) => day.review).length} />
        <Stat label="Quiz days" value={days.filter((day) => day.quizScore !== null).length} />
      </div>

      <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Daily performance</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Score counts the activities scheduled that day: Pre-SOGP lesson, teaching, morning prayer and review. — means not scheduled.
          </p>
        </div>
        {days.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-zinc-500">
            No programme days yet for this enrollee.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">Date</th>
                  <th className="whitespace-nowrap px-4 py-3">Day</th>
                  <th className="whitespace-nowrap px-4 py-3">Pre-SOGP</th>
                  <th className="whitespace-nowrap px-4 py-3">Teaching</th>
                  <th className="whitespace-nowrap px-4 py-3">Morning prayer</th>
                  <th className="whitespace-nowrap px-4 py-3">Review</th>
                  <th className="whitespace-nowrap px-4 py-3">Quiz</th>
                  <th className="whitespace-nowrap px-4 py-3">Response</th>
                  <th className="whitespace-nowrap px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {days.map((day) => {
                  const isToday = day.dateKey === todayKey;
                  return (
                    <tr key={day.dateKey} className={isToday ? "bg-sky-50/60" : undefined}>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-zinc-900">
                        {formatDay(day.dateKey)}
                        {isToday ? <span className="ml-1.5 text-[10px] font-normal text-zinc-500">Today</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">{day.label ?? "—"}</td>
                      <td className="px-4 py-2.5"><Mark value={day.prep} /></td>
                      <td className="px-4 py-2.5"><Mark value={day.listened} /></td>
                      <td className="px-4 py-2.5"><Mark value={day.prayerWatch} /></td>
                      <td className="px-4 py-2.5"><Mark value={day.review} /></td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        {day.quizScore === null ? (
                          <span className="text-zinc-300">—</span>
                        ) : (
                          <span className={day.quizScore >= 70 ? "font-medium text-emerald-700" : "text-amber-700"}>
                            {day.quizScore}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {day.responseSubmitted ? (
                          <span className="font-medium text-emerald-700">Submitted</span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5"><Score day={day} isToday={isToday} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
