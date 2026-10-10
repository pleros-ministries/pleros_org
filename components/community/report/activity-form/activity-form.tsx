"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  STEP_TITLES,
  canJumpTo,
  firstErrorId,
  prefillFromFollowUps,
  stepsFor,
  toSaveInput,
  validateStep,
  withKind,
  type ActivityDraft,
  type StepId,
} from "@/lib/community/activity-form";
import type { ActivityKind } from "@/lib/community/ministry-activities";
import { saveMinistryActivity } from "@/app/(site)/dashboard/community/_actions/report-actions";

import { dayHref, dayName } from "../day-picker";
import { card, errorText, outlineButton, primaryButton, textLink } from "../styles";
import { StepFollowUps, type FollowUpCandidate } from "./step-follow-ups";
import { StepKind } from "./step-kind";
import { StepNumbers } from "./step-numbers";
import { StepPeople } from "./step-people";
import { StepReview } from "./step-review";
import { StepWhere } from "./step-where";
import { StepperHeader } from "./stepper-header";

/**
 * The step-by-step activity form. The kind chosen first decides which steps
 * follow; each step is checked only when Next is pressed, and everything is
 * saved once at the end.
 */
export function ActivityForm({
  mode,
  today,
  dateKey,
  activityId,
  initial,
  contacts,
}: {
  mode: "create" | "edit";
  today: string;
  dateKey: string;
  activityId?: number;
  initial: ActivityDraft;
  /** The member's people, offered by the follow-up step. */
  contacts: FollowUpCandidate[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [stepIndex, setStepIndex] = useState(() =>
    mode === "edit" ? stepsFor(initial.kind).length - 1 : 0,
  );
  const [attempted, setAttempted] = useState<ReadonlySet<StepId>>(() => new Set());
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = stepsFor(draft.kind);
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const step = steps[safeIndex];
  const errors = attempted.has(step) ? validateStep(step, draft) : {};
  const last = safeIndex === steps.length - 1;

  function update(patch: Partial<ActivityDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function chooseKind(kind: ActivityKind) {
    setDraft((current) => (current.kind === kind ? current : withKind(current, kind)));
    goTo(1);
  }

  function goTo(index: number) {
    setStepIndex(index);
    setServerError(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  /** Checks the current step; on a problem shows it and focuses the first field. */
  function passes(): boolean {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length === 0) return true;
    setAttempted((current) => new Set(current).add(step));
    const id = firstErrorId(stepErrors);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.focus());
    return false;
  }

  function leaveStep() {
    if (step === "people" && draft.kind === "follow_up") {
      setDraft((current) => prefillFromFollowUps(current));
    }
  }

  function next() {
    if (!passes()) return;
    leaveStep();
    goTo(safeIndex + 1);
  }

  function jump(index: number) {
    if (index === safeIndex) return;
    if (index < safeIndex) {
      goTo(index);
      return;
    }
    if (!passes()) return;
    if (!canJumpTo(steps, index, draft)) return;
    leaveStep();
    goTo(index);
  }

  function save() {
    if (!passes()) return;
    setServerError(null);
    startTransition(async () => {
      try {
        const result = await saveMinistryActivity(toSaveInput(draft, activityId));
        if (!result.ok) {
          setServerError(result.error);
          return;
        }
        router.push(dayHref(dateKey, today, "saved"));
      } catch {
        setServerError("Could not save your activity. Try again.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            {mode === "edit" ? "Edit activity" : "Add an activity"}
          </h1>
          <p className="text-sm text-zinc-500">For {dayName(dateKey, today).toLowerCase()}.</p>
        </div>
        <Link href={dayHref(dateKey, today)} className={textLink}>
          Cancel
        </Link>
      </header>

      <StepperHeader
        steps={steps}
        index={safeIndex}
        draft={draft}
        canJump={mode === "edit"}
        onJump={jump}
      />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (last) save();
          else next();
        }}
        className={`${card} grid gap-5 p-4 sm:p-5`}
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="ppc-heading text-base font-semibold text-zinc-900 outline-none"
        >
          {STEP_TITLES[step]}
        </h2>

        {step === "kind" ? (
          <StepKind
            draft={draft}
            errors={errors}
            onChoose={chooseKind}
            locked={mode === "edit"}
          />
        ) : null}
        {step === "where" ? <StepWhere draft={draft} errors={errors} update={update} /> : null}
        {step === "numbers" ? (
          <StepNumbers draft={draft} errors={errors} update={update} />
        ) : null}
        {step === "people" ? (
          draft.kind === "follow_up" ? (
            <StepFollowUps
              draft={draft}
              errors={errors}
              update={update}
              contacts={contacts}
            />
          ) : (
            <StepPeople draft={draft} errors={errors} update={update} />
          )
        ) : null}
        {step === "review" ? (
          <StepReview
            draft={draft}
            errors={errors}
            update={update}
            onJump={(id) => jump(steps.indexOf(id))}
            stepIndex={(id) => steps.indexOf(id)}
          />
        ) : null}

        {serverError ? (
          <p role="alert" className={errorText}>
            {serverError}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          {safeIndex > 0 ? (
            <button type="button" onClick={() => goTo(safeIndex - 1)} className={outlineButton}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step !== "kind" || mode === "edit" ? <button type="submit" disabled={pending} className={primaryButton}>
            {last
              ? pending
                ? "Saving…"
                : mode === "edit"
                  ? "Save changes"
                  : "Save activity"
              : "Next"}
          </button> : null}
        </div>
      </form>
    </div>
  );
}
