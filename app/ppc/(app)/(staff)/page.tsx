import { Activity, Clock3, Layers2, MessageCircle, NotebookText } from "lucide-react";

import {
  buildDashboardStats,
  DEMO_QA_THREADS,
  DEMO_REVIEW_QUEUE,
  DEMO_STUDENTS,
  formatRelativeDay,
} from "@/lib/ppc-demo";

const stats = buildDashboardStats(DEMO_STUDENTS);

const metricCards = [
  {
    label: "Active students",
    value: String(stats.activeStudents),
    hint: "Currently active",
    icon: Activity,
  },
  {
    label: "Avg. progress",
    value: `${stats.averageProgress}%`,
    hint: "Across demo cohort",
    icon: Layers2,
  },
  {
    label: "Pending reviews",
    value: String(stats.pendingReviews),
    hint: "Short-text + written",
    icon: Clock3,
  },
  {
    label: "Open Q&A",
    value: String(stats.pendingQa),
    hint: "Private student threads",
    icon: MessageCircle,
  },
];

export default function PpcDashboardPage() {
  return (
    <div className="grid gap-6">
      <section className="rounded-md border border-zinc-200 bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Perfecting Courses Platform
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
          Operations Dashboard
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Demo state with realistic values for student progress, review load, and
          intervention points.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;

          return (
            <article
              key={metric.label}
              className="rounded-sm border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-600">{metric.label}</p>
                <Icon className="size-4 text-zinc-500" />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{metric.hint}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900">Review queue</h3>
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              {DEMO_REVIEW_QUEUE.length} items
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {DEMO_REVIEW_QUEUE.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <p className="text-sm font-medium text-zinc-900">
                  {item.studentName} - L{item.level} {item.lesson}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {item.type === "short_text" ? "Short text" : "Written response"} - {" "}
                  {item.status.replace("_", " ")}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-900">Recent activity</h3>
            <NotebookText className="size-4 text-zinc-500" />
          </div>
          <div className="mt-3 grid gap-2">
            {DEMO_STUDENTS.slice(0, 5).map((student) => (
              <div key={student.id} className="rounded border border-zinc-200 px-3 py-2">
                <p className="text-sm font-medium text-zinc-900">{student.name}</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {student.currentLesson} - {formatRelativeDay(student.lastActivity)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-sm border border-zinc-200 bg-white p-4">
        <h3 className="text-base font-semibold text-zinc-900">Open Q&A threads</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {DEMO_QA_THREADS.map((thread) => (
            <div key={thread.id} className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="text-sm font-medium text-zinc-900">{thread.subject}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {thread.studentName} - L{thread.level} - {thread.status}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
