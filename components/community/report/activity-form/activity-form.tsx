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
import { MINISTRY_FIELDS } from "@/lib/community/ministry-report";
import { normaliseMeetingDetails, type MeetingReportingRole } from "@/lib/community/daily-report";
import { MeetingFields } from "./meeting-fields";
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
  dailyReporting = false,
  initialMeeting,
  category,
}: {
  mode: "create" | "edit";
  today: string;
  dateKey: string;
  activityId?: number;
  initial: ActivityDraft;
  /** The member's people, offered by the follow-up step. */
  contacts: FollowUpCandidate[];
  dailyReporting?: boolean;
  initialMeeting?: { role: MeetingReportingRole; taught: string | null };
  category?: "ministry" | "meetings";
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [meetingRole, setMeetingRole] = useState<MeetingReportingRole | null>(initialMeeting?.role ?? null);
  const [taught, setTaught] = useState(initialMeeting?.taught ?? "");
  const meeting = dailyReporting && (draft.kind === "teaching_meeting" || draft.kind === "prayer_meeting");
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
    if (draft.kind !== kind) {
      setDraft(withKind(draft, kind));
      setMeetingRole(null);
      setTaught("");
    }
    goTo(1);
  }

  function goTo(index: number) {
    setStepIndex(index);
    setServerError(null);
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  /** Checks the current step; on a problem shows it and focuses the first field. */
  function passes(): boolean {
    if (meeting && (step === "numbers" || step === "review")) {
      const result = normaliseMeetingDetails({ kind: draft.kind!, role: meetingRole, taught, attendance: Number(draft.numbers.attendance || "0") });
      if (!result.ok) { setServerError(result.error); return false; }
    }
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
        const result = await saveMinistryActivity({ ...toSaveInput(draft, activityId), ...(meeting ? { meetingRole: meetingRole ?? undefined, taught } : {}) });
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
            category={category}
          />
        ) : null}
        {step === "where" ? <StepWhere draft={draft} errors={errors} update={update} /> : null}
        {step === "numbers" ? (
          <div className="grid gap-4">
            {meeting ? <MeetingFields role={meetingRole} taught={taught} onTaught={setTaught} onRole={(role) => {
              setMeetingRole(role);
              if (role !== "leader") setTaught("");
              if (role === "member") update({ numbers: Object.fromEntries(MINISTRY_FIELDS.map(({ key }) => [key, key === "attendance" ? "1" : "0"])) as ActivityDraft["numbers"] });
            }} /> : null}
            {!(meeting && meetingRole === "member") ? <StepNumbers draft={draft} errors={errors} update={update} /> : null}
          </div>
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
          <div className="grid gap-4">
          {meeting ? <div className="grid gap-1 rounded-lg border border-(--color-line) p-3 text-[13px]">
            <p>Your role · {meetingRole ? meetingRole[0].toUpperCase() + meetingRole.slice(1) : "Not chosen"}</p>
            {meetingRole === "leader" && taught ? <p className="whitespace-pre-wrap">What was taught · {taught}</p> : null}
            <button type="button" onClick={() => jump(steps.indexOf("numbers"))} className={`${textLink} w-fit`}>Edit meeting role</button>
          </div> : null}
          <StepReview
            draft={draft}
            errors={errors}
            update={update}
            onJump={(id) => jump(steps.indexOf(id))}
            stepIndex={(id) => steps.indexOf(id)}
          />
          </div>
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
