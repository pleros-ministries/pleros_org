"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";

import {
  moveEnrolleesToCohort,
  setCohortMoveResponse,
} from "@/app/admin/(app)/(pastor-only)/_actions/pastor-followup-actions";
import { FollowUpMessageDialog } from "@/components/ppc/follow-up-message-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PastorEnrollee } from "@/lib/db/queries/pastor-followups";
import {
  cohortMoveLabel,
  type CohortMoveResponse,
  type CohortMoveState,
  type CohortMoveTarget,
} from "@/lib/sogp/cohort-move";
import { buildCohortInviteMessage } from "@/lib/sogp/follow-up-messages";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

const TAG_TONES: Record<CohortMoveState["status"], string> = {
  asked: "border-amber-200 bg-amber-50 text-amber-700",
  declined: "border-zinc-200 bg-white text-zinc-500",
  moved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

/** Where an enrollee stands on moving cohort; renders nothing if never asked. */
export function CohortMoveTag({ state }: { state: CohortMoveState | null | undefined }) {
  if (!state) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold ${TAG_TONES[state.status]}`}
    >
      {cohortMoveLabel(state)}
      {state.status === "asked" ? ` · ${relativeTime(state.at)}` : ""}
    </span>
  );
}

const primaryButton =
  "inline-flex h-9 items-center rounded-sm bg-[var(--color-brand-blue)] px-3.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60";
const secondaryButton =
  "inline-flex h-9 items-center rounded-sm border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50";

/** The one confirmation every move goes through — a move has no undo. */
export function CohortMoveConfirmDialog({
  open,
  onOpenChange,
  who,
  target,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "Ada Obi" or "12 enrollees". */
  who: string;
  target: CohortMoveTarget;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3">
        <DialogHeader>
          <DialogTitle>
            Move {who} to {target.title}?
          </DialogTitle>
          <DialogDescription>
            They leave their current cohort and start Pre-SOGP afresh with {target.title} (
            {target.datesLabel}). Their pastor, group, quizzes and written responses stay with
            them, and each person gets a confirmation email. This cannot be undone from here.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button" disabled={pending} onClick={onConfirm} className={primaryButton}>
            {pending ? "Moving…" : `Move to ${target.title}`}
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className={secondaryButton}>
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ask, record the answer, and move — for one enrollee who can move to the
 * target cohort. Callers decide who that is with `getCohortMoveBlocker`.
 */
export function CohortMoveControls({
  enrollee,
  target,
  state,
}: {
  enrollee: PastorEnrollee;
  target: CohortMoveTarget;
  state: CohortMoveState | null | undefined;
}) {
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const response: CohortMoveResponse | null =
    state && state.status !== "moved" ? state.status : null;
  // The answer shows immediately; revalidation then replaces `state`.
  const [shownResponse, showResponse] = useOptimistic(response);

  function saveResponse(value: CohortMoveResponse | null) {
    setError(null);
    startTransition(async () => {
      showResponse(value);
      const result = await setCohortMoveResponse({
        enrollmentIds: [enrollee.enrollmentId],
        targetCohortId: target.id,
        response: value,
      });
      if (result.error) setError(result.error);
    });
  }

  function move() {
    setError(null);
    startTransition(async () => {
      const result = await moveEnrolleesToCohort({
        enrollmentIds: [enrollee.enrollmentId],
        targetCohortId: target.id,
      });
      setConfirmOpen(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      const [skipped] = result.skipped;
      if (skipped) {
        setError(`Not moved: ${skipped.reason}.`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["pastor", "sogp", "daily"] });
    });
  }

  const name = enrollee.firstName || enrollee.name;
  const button =
    "inline-flex h-8 items-center rounded-sm border px-3 text-xs font-medium disabled:opacity-60";

  return (
    <div className="flex basis-full flex-wrap items-center gap-2">
      <select
        aria-label={`Answer from ${enrollee.name} about ${target.title}`}
        value={shownResponse ?? ""}
        disabled={pending}
        onChange={(event) => saveResponse((event.target.value || null) as CohortMoveResponse | null)}
        className={`h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs disabled:opacity-60 ${
          shownResponse ? "text-zinc-800" : "text-zinc-400"
        }`}
      >
        <option value="">Not asked</option>
        <option value="asked">Asked</option>
        <option value="declined">Declined</option>
      </select>
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        className={`${button} border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`}
      >
        Ask about {target.title}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
        className={`${button} border-[var(--color-brand-blue)] bg-white text-[var(--color-brand-blue)] hover:bg-sky-50`}
      >
        Move to {target.title}
      </button>
      {error ? (
        <span role="alert" className="basis-full text-xs text-rose-700">
          {error}
        </span>
      ) : null}

      <FollowUpMessageDialog
        open={askOpen}
        onOpenChange={setAskOpen}
        enrollee={enrollee}
        pastorUserId={enrollee.pastorUserId}
        variant={{
          title: `Ask ${name} about ${target.title}`,
          description: "Edit this invitation before sending. Sending marks them as asked.",
          message: buildCohortInviteMessage(enrollee.firstName, target.title, target.datesLabel),
          emailSubject: `Join ${target.title}`,
          onSent: () => saveResponse("asked"),
        }}
      />
      <CohortMoveConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        who={enrollee.name}
        target={target}
        pending={pending}
        onConfirm={move}
      />
    </div>
  );
}
