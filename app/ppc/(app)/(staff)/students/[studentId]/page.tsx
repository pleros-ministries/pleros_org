import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleCheck, Clock3, MapPin, MessageSquareText, NotebookPen } from "lucide-react";

import { formatShortDate } from "@/lib/ppc-demo";
import { buildStudentDetail } from "@/lib/ppc-student-detail";

type StudentDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

function responseStatusClass(status: "draft" | "pending" | "needs_revision" | "approved"): string {
  if (status === "approved") {
    return "bg-zinc-900 text-zinc-50";
  }

  if (status === "needs_revision") {
    return "bg-zinc-200 text-zinc-800";
  }

  if (status === "pending") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-zinc-100 text-zinc-500";
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  const detail = buildStudentDetail(studentId);

  if (!detail) {
    notFound();
  }

  const { student, levelSummary, responses, timeline } = detail;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/ppc/students"
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="size-3.5" />
            Back to students
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{student.name}</h2>
          <p className="text-sm text-zinc-600">{student.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700"
          >
            Suspend student
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-zinc-900 bg-zinc-900 px-3 text-xs font-medium text-zinc-50"
          >
            Reset progress
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Current level</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">Level {student.level}</p>
          <p className="mt-1 text-xs text-zinc-600">{levelSummary.completedLessons} completed lessons</p>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Graduation</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {levelSummary.canGraduate ? "Ready" : "Blocked"}
              </p>
              <p className="mt-1 text-xs text-zinc-600">{student.graduationStatus.replace("_", " ")}</p>
            </div>
            {levelSummary.canGraduate ? (
              <CircleCheck className="size-4 text-zinc-900" />
            ) : (
              <Clock3 className="size-4 text-zinc-600" />
            )}
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Pending reviews</p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">{levelSummary.pendingResponseClearance}</p>
          <p className="mt-1 text-xs text-zinc-600">Need approval/revision</p>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Location</p>
              <p className="mt-2 text-sm font-semibold text-zinc-900">{student.location}</p>
              <p className="mt-1 text-xs text-zinc-600">Last activity {formatShortDate(student.lastActivity)}</p>
            </div>
            <MapPin className="size-4 text-zinc-600" />
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Submission history</p>
              <p className="text-xs text-zinc-600">Quiz short-text + written responses</p>
            </div>
            <NotebookPen className="size-4 text-zinc-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] divide-y divide-zinc-200 text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Lesson</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Reviewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {responses.map((response) => (
                  <tr key={response.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-700">{response.lessonLabel}</td>
                    <td className="px-4 py-3 text-zinc-700">{response.kind.replace("_", " ")}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${responseStatusClass(
                          response.status,
                        )}`}
                      >
                        {response.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{formatShortDate(response.submittedAt)}</td>
                    <td className="px-4 py-3 text-zinc-700">{response.reviewedBy ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Private timeline</p>
              <p className="text-xs text-zinc-600">Student + staff activity log</p>
            </div>
            <MessageSquareText className="size-4 text-zinc-600" />
          </div>

          <div className="mt-3 grid gap-2">
            {timeline.map((event) => (
              <article key={event.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-900">{event.event}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{formatShortDate(event.occurredAt)}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
