"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw } from "lucide-react";

import {
  approvePastorSubmission,
  requestPastorRevision,
} from "@/app/admin/(app)/(pastor-only)/_actions/pastor-review-actions";
import { recordFollowUpContact } from "@/app/admin/(app)/(pastor-only)/_actions/pastor-followup-actions";
import { PageHeader } from "@/components/ppc/page-header";
import { getReviewGradingReadiness } from "@/lib/ppc-staff-workflows";
import type {
  PastorEnrollee,
  PastorEnrolleeSubmission,
} from "@/lib/db/queries/pastor-followups";

function digitsOnly(phone: string) {
  return phone.replace(/\D/g, "");
}

function statusLabel(status: PastorEnrolleeSubmission["status"]) {
  switch (status) {
    case "approved":
      return { text: "Approved", className: "bg-emerald-50 text-emerald-700" };
    case "needs_revision":
      return { text: "Needs revision", className: "bg-amber-50 text-amber-700" };
    case "submitted":
      return { text: "Submitted, awaiting review", className: "bg-sky-50 text-sky-700" };
    case "draft":
      return { text: "Draft — not submitted yet", className: "bg-zinc-100 text-zinc-500" };
    default:
      return { text: "Not started", className: "bg-zinc-100 text-zinc-500" };
  }
}

function SubmissionCard({
  enrollmentId,
  submission,
  canReview,
}: {
  enrollmentId: number;
  submission: PastorEnrolleeSubmission;
  canReview: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const badge = statusLabel(submission.status);
  const readiness = getReviewGradingReadiness({
    status: submission.status ?? "draft",
    content: submission.content ?? "",
    responsePrompt: submission.responsePrompt,
    responseMarkingGuide: submission.responseMarkingGuide,
  });
  const canAct =
    canReview && submission.submissionId != null && readiness.canGrade;

  function handleApprove() {
    if (!submission.submissionId) return;
    setError(null);
    startTransition(async () => {
      const result = await approvePastorSubmission({
        enrollmentId,
        submissionId: submission.submissionId!,
      });
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleRequestRevision() {
    if (!submission.submissionId || !note.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await requestPastorRevision({
        enrollmentId,
        submissionId: submission.submissionId!,
        note: note.trim(),
      });
      if (result.error) setError(result.error);
      else {
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {submission.weekNumber ? `Week ${submission.weekNumber}` : ""}
            {submission.dayNumber ? ` · Day ${submission.dayNumber}` : ""}
          </p>
          <p className="ppc-heading text-sm font-semibold text-zinc-900">
            {submission.lessonTitle}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${badge.className}`}>
          {badge.text}
        </span>
      </div>

      <details className="text-xs text-zinc-600">
        <summary className="cursor-pointer select-none font-medium text-zinc-700">
          Prompt &amp; marking guide
        </summary>
        <div className="mt-2 grid gap-2">
          {submission.responsePrompt ? (
            <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2">
              <p className="mb-1 text-[11px] font-medium text-zinc-700">Prompt</p>
              <div
                className="prose prose-sm max-w-none text-zinc-600"
                dangerouslySetInnerHTML={{ __html: submission.responsePrompt }}
              />
            </div>
          ) : null}
          {submission.responseMarkingGuide ? (
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="mb-1 text-[11px] font-medium text-amber-800">Marking guide</p>
              <div
                className="prose prose-sm max-w-none text-amber-900"
                dangerouslySetInnerHTML={{ __html: submission.responseMarkingGuide }}
              />
            </div>
          ) : null}
        </div>
      </details>

      <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="mb-1 text-[11px] font-medium text-zinc-700">Their response</p>
        <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
          {submission.content?.trim() || "Not submitted yet."}
        </p>
      </div>

      {submission.reviewerNote ? (
        <div className="rounded-sm border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
          <RotateCcw className="mr-1 inline size-3" />
          {submission.reviewerNote}
        </div>
      ) : null}

      {error ? <p className="text-[11px] text-rose-700">{error}</p> : null}

      {canReview && submission.submissionId != null ? (
        <div className="grid gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={pending || !canAct}
              title={!readiness.canGrade ? readiness.detail : undefined}
              className="flex h-7 items-center gap-1.5 rounded-sm bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle2 className="size-3" />
              Approve
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              type="text"
              placeholder="Revision note…"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-8 rounded-sm border border-zinc-200 px-2 text-xs outline-none focus:border-zinc-400"
            />
            <button
              type="button"
              onClick={handleRequestRevision}
              disabled={pending || !canAct || !note.trim()}
              title={!readiness.canGrade ? readiness.detail : undefined}
              className="h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Request revision
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PastorEnrolleeReviewView({
  enrollee,
  submissions,
  isAdmin,
}: {
  enrollee: PastorEnrollee;
  submissions: PastorEnrolleeSubmission[];
  isAdmin: boolean;
}) {
  const [, startTransition] = useTransition();

  function logContact(channel: "whatsapp" | "call" | "email") {
    startTransition(async () => {
      await recordFollowUpContact({ enrollmentId: enrollee.enrollmentId, channel });
    });
  }

  const contactButton =
    "inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50";

  return (
    <div className="grid gap-4">
      <PageHeader
        title={enrollee.name}
        description={isAdmin ? `${enrollee.email} · Admin preview` : enrollee.email}
      />

      <section className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
        <p>
          {enrollee.phone} · {enrollee.region ? `${enrollee.region}, ` : ""}
          {enrollee.country}
        </p>
        <p>
          {enrollee.cohortTitle} · {enrollee.status.replaceAll("_", " ")} ·
          Prep {enrollee.preparationDaysComplete}/{enrollee.preparationDaysTotal} ·
          Morning prayer {enrollee.morningPrayerDays}d · Reviews{" "}
          {enrollee.reviewSessionsComplete}
        </p>
        <p>
          Quizzes {enrollee.quizzesPassed}/{enrollee.quizzesTotal} · Responses
          approved {enrollee.responsesApproved} · Certificate:{" "}
          {enrollee.certificateIssued ? "Issued" : "Not yet"} · Referred{" "}
          {enrollee.referredCount}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {enrollee.whatsappConsent ? (
            <a
              href={`https://wa.me/${digitsOnly(enrollee.phone)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => logContact("whatsapp")}
              className={contactButton}
            >
              WhatsApp
            </a>
          ) : null}
          <a href={`tel:${enrollee.phone}`} onClick={() => logContact("call")} className={contactButton}>
            Call
          </a>
          <a
            href={`mailto:${enrollee.email}`}
            onClick={() => logContact("email")}
            className={contactButton}
          >
            Email
          </a>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          SOGP assignments
        </h2>
        {submissions.length === 0 ? (
          <p className="rounded-sm border border-zinc-200 bg-white p-5 text-center text-xs text-zinc-500">
            No written-response lessons in this cohort yet.
          </p>
        ) : (
          submissions.map((submission) => (
            <SubmissionCard
              key={submission.lessonId}
              enrollmentId={enrollee.enrollmentId}
              submission={submission}
              canReview
            />
          ))
        )}
      </section>
    </div>
  );
}
