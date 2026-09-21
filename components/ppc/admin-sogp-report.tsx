"use client";

import { useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, Download, Users } from "lucide-react";

import { getAdminSogpReportData } from "@/app/admin/_actions/read-actions";
import {
  getAdminSogpLessonRoster,
  getAdminSogpLiveClassRoster,
  getAdminSogpPrayerWatchRoster,
  type AdminSogpLessonRosterEntry,
  type AdminSogpLiveClassRosterEntry,
  type AdminSogpPrayerWatchRosterEntry,
} from "@/app/admin/_actions/sogp-report-actions";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";
import { UNASSIGNED_PASTOR_FILTER } from "@/lib/admin-query";
import type {
  AdminSogpData,
  AdminSogpReportCohort,
  AdminSogpReportData,
  AdminSogpReportPastorBreakdown,
  AdminSogpReportSignupPoint,
} from "@/lib/admin-query";
import { Metric } from "@/components/ppc/admin-sogp-page";
import { DailyByPastorSection } from "@/components/ppc/admin-sogp-daily-by-pastor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  enrolled: "#94a3b8",
  preparing: "#60a5fa",
  active: "#22c55e",
  carryover: "#f59e0b",
  completed: "#0ea5e9",
  withdrawn: "#f43f5e",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function pct(value: number) {
  return `${Math.round(value)}%`;
}

function ExportButton({ cohortId, pastorFilter }: { cohortId: number | "all"; pastorFilter: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/sogp/report/export?cohortId=${cohortId}&pastorId=${pastorFilter}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Export failed");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sogp-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex h-8 w-fit items-center gap-1.5 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white disabled:opacity-50"
      >
        <Download className="size-3.5" />
        {loading ? "Preparing…" : "Export to Excel"}
      </button>
      {error ? <p className="text-[10px] text-rose-700">{error}</p> : null}
    </div>
  );
}

function WeeklyParticipationChart({ cohort }: { cohort: AdminSogpReportCohort }) {
  const data = cohort.weeklyParticipation.map((week) => ({
    name: `Week ${week.week}`,
    "Track completion %": Math.round(week.trackCompletionPercent),
    "Live class %": Math.round(week.liveClassAttendancePercent),
    "Prayer watch %": Math.round(week.prayerWatchParticipationPercent),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#a1a1aa" />
          <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" domain={[0, 100]} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="Track completion %" fill="#2563eb" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Live class %" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Prayer watch %" fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CohortComparisonChart({ cohorts }: { cohorts: AdminSogpReportCohort[] }) {
  const data = cohorts.map((cohort) => ({
    name: cohort.title,
    "Average completion %": Math.round(cohort.averageCompletionPercent),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="Average completion %" fill="#2563eb" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatusBreakdownChart({ cohort }: { cohort: AdminSogpReportCohort }) {
  const data = Object.entries(cohort.statusBreakdown)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({ name: status.replaceAll("_", " "), value, status }));
  if (!data.length) return <p className="text-xs text-zinc-500">No enrolments yet.</p>;
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#a1a1aa"} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function LeftBehindTable({ entries }: { entries: AdminSogpReportData["leftBehind"] }) {
  if (!entries.length) {
    return <p className="px-4 py-10 text-center text-xs text-zinc-500">No participants currently flagged.</p>;
  }
  return (
    <table className="min-w-full text-left text-xs">
      <thead className="bg-zinc-50 text-zinc-500">
        <tr>
          <th className="px-4 py-3">Name</th>
          <th className="px-4 py-3">Cohort</th>
          <th className="px-4 py-3">Pastor</th>
          <th className="px-4 py-3">Week</th>
          <th className="px-4 py-3">Completion</th>
          <th className="px-4 py-3">Last activity</th>
          <th className="px-4 py-3">Reason</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {entries.map((entry) => (
          <tr key={entry.enrollmentId}>
            <td className="px-4 py-3">
              <p className="font-medium text-zinc-900">{entry.name}</p>
              <p className="mt-0.5 text-[10px] text-zinc-500">{entry.email}</p>
            </td>
            <td className="px-4 py-3">{entry.cohortTitle}</td>
            <td className="px-4 py-3">{entry.pastorName ?? <span className="text-zinc-400">Unassigned</span>}</td>
            <td className="px-4 py-3">{entry.currentWeek ?? "Cohort ended"}</td>
            <td className="px-4 py-3">
              {entry.completedTrackCount}/{entry.expectedTrackCount} ({pct(entry.completionPercent)})
            </td>
            <td className="px-4 py-3">{entry.lastActivityAt ? formatDate(entry.lastActivityAt) : "Never"}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {entry.flags.includes("behind_pace") ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    Behind pace
                  </span>
                ) : null}
                {entry.flags.includes("inactive_7_days") ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-800">
                    Inactive 7+ days
                  </span>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function RosterDialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

function BoolMark({ value }: { value: boolean }) {
  return (
    <span className={value ? "font-medium text-emerald-700" : "text-zinc-400"}>{value ? "Yes" : "No"}</span>
  );
}

function LessonRosterDialog({
  cohortId,
  pastorId,
  lesson,
  onClose,
}: {
  cohortId: number;
  pastorId?: string;
  lesson: { lessonId: number; title: string; dayNumber: number | null } | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<AdminSogpLessonRosterEntry[]>({
    queryKey: ["admin", "sogp", "report", "lesson-roster", cohortId, pastorId ?? "all", lesson?.lessonId],
    queryFn: () => getAdminSogpLessonRoster(cohortId, lesson!.lessonId, pastorId),
    enabled: Boolean(lesson),
  });

  const listened = data?.filter((row) => row.audioListened).length ?? 0;
  const quizPassed = data?.filter((row) => row.quizPassed).length ?? 0;
  const writtenApproved = data?.filter((row) => row.writtenApproved).length ?? 0;

  return (
    <RosterDialogShell
      open={Boolean(lesson)}
      onOpenChange={(open) => !open && onClose()}
      title={lesson ? `${lesson.dayNumber ? `Day ${lesson.dayNumber} — ` : ""}${lesson.title}` : ""}
      description={data ? `${listened}/${data.length} listened · ${quizPassed}/${data.length} passed quiz · ${writtenApproved}/${data.length} written approved` : undefined}
    >
      {isLoading ? <p className="text-xs text-zinc-500">Loading roster…</p> : null}
      {error ? <p className="text-xs text-rose-700">Could not load roster.</p> : null}
      {data ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Audio</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">Quiz</th>
                <th className="px-3 py-2">Written</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map((row) => (
                <tr key={row.enrollmentId}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-zinc-900">{row.name}</p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">{row.email}</p>
                  </td>
                  <td className="px-3 py-2"><BoolMark value={row.audioListened} /></td>
                  <td className="px-3 py-2"><BoolMark value={row.notesRead} /></td>
                  <td className="px-3 py-2">
                    <BoolMark value={row.quizPassed} />
                    {row.highestQuizScore !== null ? (
                      <span className="ml-1 text-[10px] text-zinc-500">({row.highestQuizScore}%)</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2"><BoolMark value={row.writtenApproved} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </RosterDialogShell>
  );
}

function AttendanceLists({
  attended,
  notAttended,
}: {
  attended: Array<{ enrollmentId: number; name: string; email: string }>;
  notAttended: Array<{ enrollmentId: number; name: string; email: string }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          Attended ({attended.length})
        </h4>
        <ul className="mt-2 grid gap-1.5 text-xs">
          {attended.length ? (
            attended.map((row) => (
              <li key={row.enrollmentId} className="rounded-sm bg-emerald-50 px-2 py-1.5">
                <p className="font-medium text-zinc-900">{row.name}</p>
                <p className="text-[10px] text-zinc-500">{row.email}</p>
              </li>
            ))
          ) : (
            <li className="text-zinc-400">None yet.</li>
          )}
        </ul>
      </div>
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
          Not attended ({notAttended.length})
        </h4>
        <ul className="mt-2 grid gap-1.5 text-xs">
          {notAttended.length ? (
            notAttended.map((row) => (
              <li key={row.enrollmentId} className="rounded-sm bg-rose-50 px-2 py-1.5">
                <p className="font-medium text-zinc-900">{row.name}</p>
                <p className="text-[10px] text-zinc-500">{row.email}</p>
              </li>
            ))
          ) : (
            <li className="text-zinc-400">Everyone attended.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function LiveClassRosterDialog({
  cohortId,
  pastorId,
  liveClass,
  onClose,
}: {
  cohortId: number;
  pastorId?: string;
  liveClass: { id: number; title: string; startsAt: string } | null;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery<AdminSogpLiveClassRosterEntry[]>({
    queryKey: ["admin", "sogp", "report", "live-class-roster", cohortId, pastorId ?? "all", liveClass?.id],
    queryFn: () => getAdminSogpLiveClassRoster(cohortId, liveClass!.id, pastorId),
    enabled: Boolean(liveClass),
  });

  return (
    <RosterDialogShell
      open={Boolean(liveClass)}
      onOpenChange={(open) => !open && onClose()}
      title={liveClass?.title ?? ""}
      description={liveClass ? formatDate(liveClass.startsAt) : undefined}
    >
      {isLoading ? <p className="text-xs text-zinc-500">Loading roster…</p> : null}
      {error ? <p className="text-xs text-rose-700">Could not load roster.</p> : null}
      {data ? (
        <AttendanceLists attended={data.filter((row) => row.attended)} notAttended={data.filter((row) => !row.attended)} />
      ) : null}
    </RosterDialogShell>
  );
}

function PrayerWatchSection({ cohort, pastorId }: { cohort: AdminSogpReportCohort; pastorId?: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const minDate = cohort.startsAt.slice(0, 10);
  const maxDate = cohort.endsAt.slice(0, 10);
  const [date, setDate] = useState(() => (today < minDate ? minDate : today > maxDate ? maxDate : today));

  const { data, isLoading, error } = useQuery<AdminSogpPrayerWatchRosterEntry[]>({
    queryKey: ["admin", "sogp", "report", "prayer-watch-roster", cohort.id, pastorId ?? "all", date],
    queryFn: () => getAdminSogpPrayerWatchRoster(cohort.id, date, pastorId),
  });

  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Prayer watch — who attended</h3>
        <label className="grid gap-1 text-xs font-medium text-zinc-700">
          Date
          <input
            type="date"
            value={date}
            min={minDate}
            max={maxDate}
            onChange={(event) => setDate(event.target.value)}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
          />
        </label>
      </div>
      <div className="mt-3">
        {isLoading ? <p className="text-xs text-zinc-500">Loading…</p> : null}
        {error ? <p className="text-xs text-rose-700">Could not load attendance.</p> : null}
        {data ? (
          <AttendanceLists attended={data.filter((row) => row.attended)} notAttended={data.filter((row) => !row.attended)} />
        ) : null}
      </div>
    </section>
  );
}

function TeachingSection({
  cohortId,
  pastorId,
  tracks,
}: {
  cohortId: number;
  pastorId?: string;
  tracks: AdminSogpData["tracks"];
}) {
  const [openLesson, setOpenLesson] = useState<{ lessonId: number; title: string; dayNumber: number | null } | null>(
    null,
  );
  const cohortTracks = tracks
    .filter((track) => track.cohortId === cohortId)
    .sort((a, b) => (a.dayNumber ?? a.curriculumOrder) - (b.dayNumber ?? b.curriculumOrder));

  if (!cohortTracks.length) {
    return <p className="text-xs text-zinc-500">No teachings scheduled for this cohort yet.</p>;
  }

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Teaching — who listened and answered</h3>
        <p className="mt-0.5 text-xs text-zinc-500">Click a lesson to see the full roster.</p>
      </div>
      <div className="divide-y divide-zinc-100">
        {cohortTracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => setOpenLesson({ lessonId: track.lessonId, title: track.title, dayNumber: track.dayNumber })}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-zinc-50"
          >
            <span>
              <span className="font-medium text-zinc-900">
                {track.dayNumber ? `Day ${track.dayNumber}` : `Order ${track.curriculumOrder}`} · {track.title}
              </span>
              <span className="ml-2 text-[10px] text-zinc-500">Week {track.weekNumber}</span>
            </span>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </button>
        ))}
      </div>
      <LessonRosterDialog cohortId={cohortId} pastorId={pastorId} lesson={openLesson} onClose={() => setOpenLesson(null)} />
    </section>
  );
}

function ReviewsSection({
  cohortId,
  pastorId,
  liveClasses,
}: {
  cohortId: number;
  pastorId?: string;
  liveClasses: AdminSogpData["liveClasses"];
}) {
  const [openLiveClass, setOpenLiveClass] = useState<{ id: number; title: string; startsAt: string } | null>(null);
  const cohortLiveClasses = liveClasses
    .filter((liveClass) => liveClass.cohortId === cohortId)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  if (!cohortLiveClasses.length) {
    return <p className="text-xs text-zinc-500">No review sessions scheduled for this cohort yet.</p>;
  }

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Reviews — who attended</h3>
        <p className="mt-0.5 text-xs text-zinc-500">Click a review session to see the full roster.</p>
      </div>
      <div className="divide-y divide-zinc-100">
        {cohortLiveClasses.map((liveClass) => (
          <button
            key={liveClass.id}
            type="button"
            onClick={() => setOpenLiveClass({ id: liveClass.id, title: liveClass.title, startsAt: liveClass.startsAt })}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-zinc-50"
          >
            <span>
              <span className="font-medium text-zinc-900">{liveClass.title}</span>
              <span className="ml-2 text-[10px] text-zinc-500">{formatDate(liveClass.startsAt)}</span>
            </span>
            <ChevronRight className="size-3.5 text-zinc-400" />
          </button>
        ))}
      </div>
      <LiveClassRosterDialog cohortId={cohortId} pastorId={pastorId} liveClass={openLiveClass} onClose={() => setOpenLiveClass(null)} />
    </section>
  );
}

function PastorBreakdownSection({
  rows,
  onSelectPastor,
}: {
  rows: AdminSogpReportPastorBreakdown[];
  onSelectPastor: (pastorId: string | null) => void;
}) {
  if (!rows.length) return null;
  const chartData = rows.map((row) => ({
    name: row.pastorName,
    "Average completion %": Math.round(row.averageCompletionPercent),
  }));

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 px-4 py-3">
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">By pastor — enrollee participation</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Click a pastor to filter the whole report. Contact attempts are clicks on WhatsApp/Call/Email, not confirmed
          conversations.
        </p>
      </div>
      <div className="h-64 w-full p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="Average completion %" fill="#2563eb" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Pastor</th>
              <th className="px-4 py-3">Enrollees</th>
              <th className="px-4 py-3">Avg completion</th>
              <th className="px-4 py-3">Reviews</th>
              <th className="px-4 py-3">Prayer watch</th>
              <th className="px-4 py-3">Left behind</th>
              <th className="px-4 py-3">Contact attempted</th>
              <th className="px-4 py-3">Last attempt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr
                key={row.pastorId ?? "unassigned"}
                onClick={() => onSelectPastor(row.pastorId)}
                className="cursor-pointer hover:bg-zinc-50"
              >
                <td className="px-4 py-3 font-medium text-zinc-900">{row.pastorName}</td>
                <td className="px-4 py-3">{row.enrollees}</td>
                <td className="px-4 py-3">{pct(row.averageCompletionPercent)}</td>
                <td className="px-4 py-3">{pct(row.liveClassAttendanceRate)}</td>
                <td className="px-4 py-3">{pct(row.prayerWatchParticipationRate)}</td>
                <td className="px-4 py-3">{row.leftBehindCount}</td>
                <td className="px-4 py-3">
                  {row.pastorId ? (
                    <>
                      {row.contactedCount}/{row.enrollees}
                      {row.neverContactedCount ? (
                        <span className="ml-1 text-[10px] text-amber-700">({row.neverContactedCount} never)</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-zinc-400">n/a</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.lastContactAttemptAt ? formatDate(row.lastContactAttemptAt) : <span className="text-zinc-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function mergeSignupTrends(cohorts: AdminSogpReportCohort[]): AdminSogpReportSignupPoint[] {
  const weekly = new Map<string, number>();
  for (const cohort of cohorts) {
    for (const point of cohort.signupTrend) {
      weekly.set(point.weekStart, (weekly.get(point.weekStart) ?? 0) + point.signups);
    }
  }
  let cumulative = 0;
  return Array.from(weekly.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, signups]) => {
      cumulative += signups;
      return { weekStart, signups, cumulative };
    });
}

function SignupGrowthSection({ points, label }: { points: AdminSogpReportSignupPoint[]; label: string }) {
  return (
    <section className="rounded-sm border border-zinc-200 bg-white p-4">
      <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Sign-up growth — {label}</h3>
      <p className="mt-0.5 text-xs text-zinc-500">New enrolments per week (Mon start) and running total.</p>
      {points.length ? (
        <div className="mt-3 h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="weekStart" tick={{ fontSize: 10 }} stroke="#a1a1aa" />
              <YAxis tick={{ fontSize: 11 }} stroke="#a1a1aa" allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="signups" name="New sign-ups" fill="#2563eb" radius={[3, 3, 0, 0]} />
              <Line dataKey="cumulative" name="Total enrolled" stroke="#22c55e" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-xs text-zinc-500">No sign-ups yet.</p>
      )}
    </section>
  );
}

export function AdminSogpReport({
  tracks,
  liveClasses,
}: {
  tracks: AdminSogpData["tracks"];
  liveClasses: AdminSogpData["liveClasses"];
}) {
  const [pastorFilter, setPastorFilter] = useState<string>("all");
  const pastorId = pastorFilter === "all" ? undefined : pastorFilter;
  const { data, isLoading, error } = useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.sogpReport, pastorFilter],
    queryFn: () => getAdminSogpReportData({ pastorId }),
    placeholderData: keepPreviousData,
  });

  const [selection, setSelection] = useState<number | "all" | null>(null);

  const defaultCohortId = useMemo(() => {
    const active = data?.cohorts.find((cohort) => cohort.status === "active");
    return active?.id ?? data?.cohorts[0]?.id ?? null;
  }, [data]);

  if (!data) {
    return error ? (
      <p className="px-4 py-10 text-center text-xs text-rose-700">Could not load the report.</p>
    ) : (
      <p className="px-4 py-10 text-center text-xs text-zinc-500">{isLoading ? "Loading report…" : ""}</p>
    );
  }

  const activeSelection: number | "all" = selection ?? defaultCohortId ?? "all";
  const selectedCohort =
    activeSelection === "all" ? null : (data.cohorts.find((cohort) => cohort.id === activeSelection) ?? null);
  const leftBehindEntries =
    activeSelection === "all"
      ? data.leftBehind
      : data.leftBehind.filter((entry) => entry.cohortId === activeSelection);
  const pastorBreakdownRows = selectedCohort
    ? data.pastorBreakdown.filter((row) => row.cohortId === selectedCohort.id)
    : [];
  const signupPoints = selectedCohort ? selectedCohort.signupTrend : mergeSignupTrends(data.cohorts);
  const pastorLabel =
    pastorFilter === "all"
      ? null
      : pastorFilter === UNASSIGNED_PASTOR_FILTER
        ? "Unassigned"
        : (data.pastors.find((pastor) => pastor.id === pastorFilter)?.name ?? "Selected pastor");

  if (!data.cohorts.length) {
    return <p className="px-4 py-10 text-center text-xs text-zinc-500">No cohorts to report on yet.</p>;
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="grid gap-1 text-xs font-medium text-zinc-700">
          Cohort
          <select
            value={activeSelection}
            onChange={(event) => setSelection(event.target.value === "all" ? "all" : Number(event.target.value))}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
          >
            <option value="all">All cohorts</option>
            {data.cohorts.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-700">
          Pastor
          <select
            value={pastorFilter}
            onChange={(event) => setPastorFilter(event.target.value)}
            className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
          >
            <option value="all">All pastors</option>
            {data.pastors.map((pastor) => (
              <option key={pastor.id} value={pastor.id}>
                {pastor.name} ({pastor.assignedCount})
              </option>
            ))}
            <option value={UNASSIGNED_PASTOR_FILTER}>Unassigned ({data.unassignedCount})</option>
          </select>
        </label>
        <div className="ml-auto">
          <ExportButton cohortId={activeSelection} pastorFilter={pastorFilter} />
        </div>
      </div>
      {pastorLabel ? (
        <p className="rounded-sm bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Showing only <span className="font-medium">{pastorLabel}</span>&rsquo;s enrollees.{" "}
          <button type="button" onClick={() => setPastorFilter("all")} className="underline underline-offset-2">
            Clear filter
          </button>
        </p>
      ) : null}

      {selectedCohort ? (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric
            label="Enrolled"
            value={selectedCohort.totalEnrollments}
            hint={selectedCohort.status.replaceAll("_", " ")}
            Icon={Users}
          />
          <Metric
            label="Average completion"
            value={pct(selectedCohort.averageCompletionPercent)}
            hint="Required tracks"
            Icon={CheckCircle2}
          />
          <Metric
            label="Prayer watch"
            value={pct(selectedCohort.prayerWatchParticipationRate)}
            hint="Morning prayer participation"
            Icon={CalendarDays}
          />
          <Metric
            label="Left behind"
            value={leftBehindEntries.length}
            hint="Behind pace or inactive"
            Icon={AlertTriangle}
          />
        </section>
      ) : null}

      {selectedCohort ? <DailyByPastorSection cohort={selectedCohort} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {selectedCohort ? (
          <section className="rounded-sm border border-zinc-200 bg-white p-4">
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Weekly participation — {selectedCohort.title}
            </h3>
            <div className="mt-3">
              <WeeklyParticipationChart cohort={selectedCohort} />
            </div>
          </section>
        ) : (
          <section className="rounded-sm border border-zinc-200 bg-white p-4">
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Cohort comparison</h3>
            <div className="mt-3">
              <CohortComparisonChart cohorts={data.cohorts} />
            </div>
          </section>
        )}
        {selectedCohort ? (
          <section className="rounded-sm border border-zinc-200 bg-white p-4">
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Status breakdown</h3>
            <div className="mt-3">
              <StatusBreakdownChart cohort={selectedCohort} />
            </div>
          </section>
        ) : (
          <section className="rounded-sm border border-zinc-200 bg-white p-4">
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Certificates issued</h3>
            <div className="mt-3 grid gap-2 text-xs">
              {data.cohorts.map((cohort) => (
                <div
                  key={cohort.id}
                  className="flex items-center justify-between border-b border-zinc-100 pb-2 last:border-0"
                >
                  <span className="text-zinc-700">{cohort.title}</span>
                  <span className="font-medium text-zinc-900">{cohort.certificatesIssued}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {selectedCohort ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <TeachingSection cohortId={selectedCohort.id} pastorId={pastorId} tracks={tracks} />
          <ReviewsSection cohortId={selectedCohort.id} pastorId={pastorId} liveClasses={liveClasses} />
        </div>
      ) : null}

      {selectedCohort ? <PrayerWatchSection cohort={selectedCohort} pastorId={pastorId} /> : null}

      <SignupGrowthSection
        points={signupPoints}
        label={selectedCohort ? selectedCohort.title : "all cohorts"}
      />

      {selectedCohort ? (
        <PastorBreakdownSection
          rows={pastorBreakdownRows}
          onSelectPastor={(id) => setPastorFilter(id ?? UNASSIGNED_PASTOR_FILTER)}
        />
      ) : null}

      <section className="overflow-x-auto rounded-sm border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Left behind</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Behind expected pace, or no recorded activity in the last 7 days.
          </p>
        </div>
        <LeftBehindTable entries={leftBehindEntries} />
      </section>
    </div>
  );
}
