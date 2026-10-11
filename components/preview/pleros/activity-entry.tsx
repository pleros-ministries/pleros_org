"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { ChoiceGroup } from "@/components/community/report/choice-chips";
import { Field, fieldAria } from "@/components/community/report/activity-form/field";
import { StepFollowUps, type FollowUpCandidate } from "@/components/community/report/activity-form/step-follow-ups";
import { StepNumbers } from "@/components/community/report/activity-form/step-numbers";
import { StepPeople } from "@/components/community/report/activity-form/step-people";
import { StepWhere } from "@/components/community/report/activity-form/step-where";
import { errorText, inputClass, textareaClass } from "@/components/community/report/styles";
import {
  blankNumbers,
  draftFromActivity,
  emptyDraft,
  fieldId,
  firstErrorId,
  prefillFromFollowUps,
  validateStep,
  withKind,
  type ActivityDraft,
  type StepErrors,
} from "@/lib/community/activity-form";
import {
  activityFields,
  activityKindConfig,
  type ActivityKind,
} from "@/lib/community/ministry-activities";
import { MINISTRY_COUNT_MAX, ministryFieldLabel } from "@/lib/community/ministry-report";
import { MEETING_KINDS, MEETING_ROLES } from "@/lib/preview/pleros/daily-report";
import { contactsFor } from "@/lib/preview/pleros/scope";
import { MEETING_TAUGHT_MAX, saveActivity } from "@/lib/preview/pleros/store";
import type { DemoActivity, DemoState, MeetingRole } from "@/lib/preview/pleros/types";
import { cn } from "@/lib/utils";

import { useDemo } from "./demo-context";
import { Badge, buttonPrimary, buttonSecondary, panel, relativeDay } from "./ui";

/** A saved demo activity in the shape the live form reads. */
function draftFromDemo(state: DemoState, activity: DemoActivity): ActivityDraft {
  const contacts = contactsFor(state, activity.personId);
  return draftFromActivity({
    ...activity,
    people: activity.contactIds
      .map((id) => contacts.find((contact) => contact.id === id))
      .filter((contact) => contact !== undefined)
      .map((contact) => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        note: contact.note,
        outcomes: contact.outcomes,
        discipleshipStatus: contact.discipleshipStatus,
      })),
    followUpPeople: activity.followUpPeople.map((row) => {
      const contact = contacts.find((item) => item.id === row.contactId);
      return {
        contactId: row.contactId,
        name: contact?.name ?? "Someone you met",
        phone: contact?.phone ?? null,
        kind: row.kind,
        outcomes: row.outcomes,
        note: row.note,
      };
    }),
  });
}

/**
 * The direct activity form: the kind is already chosen, so every section is
 * on one page in the order the live stepper uses. Messages appear only after
 * a save attempt, then follow the fields as they are corrected.
 */
export function ActivityEntry({
  kind,
  existing,
  onBack,
  onSaved,
}: {
  kind: ActivityKind;
  existing?: DemoActivity;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { state, viewer, day, today, run } = useDemo();
  const config = activityKindConfig(kind);
  const isMeeting = MEETING_KINDS.includes(kind);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [draft, setDraft] = useState<ActivityDraft>(() =>
    existing ? draftFromDemo(state, existing) : withKind(emptyDraft(day), kind),
  );
  const [role, setRole] = useState<MeetingRole | null>(existing?.meetingRole ?? null);
  const [taught, setTaught] = useState(existing?.taught ?? "");
  const [attempted, setAttempted] = useState(false);
  const [numbersTouched, setNumbersTouched] = useState(Boolean(existing));

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const contacts: FollowUpCandidate[] = contactsFor(state, viewer.id).map((contact) => ({
    id: contact.id,
    name: contact.name,
    phone: contact.phone,
    note: contact.note,
    metDate: contact.metDate,
    followedUpAt: contact.followedUpAt,
    salvationStatus: contact.salvationStatus,
  }));

  function update(patch: Partial<ActivityDraft>) {
    if (patch.numbers) setNumbersTouched(true);
    // Until the numbers are typed, a discipleship count follows the people picked.
    const follow = Boolean(patch.followUps) && !numbersTouched;
    setDraft((current) => {
      const next = { ...current, ...patch };
      if (follow && next.kind === "follow_up") {
        const blank = blankNumbers();
        return prefillFromFollowUps({
          ...next,
          numbers: { ...next.numbers, followUps: blank.followUps, saved: blank.saved, filled: blank.filled, healed: blank.healed },
        });
      }
      return next;
    });
  }

  function validateAll(): StepErrors {
    const errors: StepErrors = {};
    if (isMeeting && !role) errors.role = "Choose your role in this meeting.";
    const order =
      config.people === "follow_up"
        ? (["people", "numbers"] as const)
        : config.people === "met"
          ? (["where", "numbers", "people"] as const)
          : (["where", "numbers"] as const);
    for (const step of order) Object.assign(errors, validateStep(step, draft));
    if (role === "leader" && taught.trim().length > MEETING_TAUGHT_MAX) {
      errors.taught = `Keep what was taught under ${MEETING_TAUGHT_MAX} characters.`;
    }
    Object.assign(errors, validateStep("review", draft));
    return errors;
  }

  const errors = attempted ? validateAll() : {};

  function submit() {
    setAttempted(true);
    const found = validateAll();
    const first = firstErrorId(found);
    if (first) {
      requestAnimationFrame(() => document.getElementById(first)?.focus());
      return;
    }
    const outcome = run((current) =>
      saveActivity(current, {
        viewerId: viewer.id,
        draft,
        activityId: existing?.id ?? null,
        meetingRole: role,
        taught,
      }),
    );
    if (outcome.ok) onSaved();
  }

  const roleConfig = MEETING_ROLES.find((item) => item.key === role);
  const roleId = fieldId("role");
  const taughtId = fieldId("taught");
  const noteId = fieldId("note");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={cn(panel, "grid overflow-hidden")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--color-line) px-4 py-3.5 sm:px-6">
        <div className="grid gap-0.5">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong) outline-none"
          >
            {existing ? `Edit ${config.label.toLowerCase()}` : config.label}
          </h2>
          <p className="text-[13px] text-(--color-text-muted)">
            For {forDay(day, today)}
          </p>
        </div>
        <button type="button" onClick={onBack} className={buttonSecondary}>
          <ArrowLeftIcon className="size-4" aria-hidden />
          Back
        </button>
      </div>

      <div className="grid gap-7 px-4 py-5 sm:px-6 sm:py-6">
        {isMeeting ? (
          <FormSection title="Your role *" >
            <div className="grid gap-1.5">
              <ChoiceGroup
                id={roleId}
                name="meeting-role"
                label="Your role in this meeting"
                layout="segmented"
                value={role}
                onChange={setRole}
                invalid={Boolean(errors.role)}
                describedBy={errors.role ? `${roleId}-error` : undefined}
                options={MEETING_ROLES.map((item) => ({ key: item.key, label: item.label }))}
              />
              {errors.role ? <p id={`${roleId}-error`} className={errorText}>{errors.role}</p> : null}
            </div>
          </FormSection>
        ) : null}

        {config.people === "follow_up" ? (
          <FormSection title="Who you followed up">
            
            <StepFollowUps draft={draft} errors={errors} update={update} contacts={contacts} />
          </FormSection>
        ) : (
          <FormSection title={isMeeting ? "The meeting" : "Where"}>
            <StepWhere draft={draft} errors={errors} update={update} />
          </FormSection>
        )}

        <FormSection title="How many people?">
          {isMeeting ? (
            <MeetingNumbers draft={draft} errors={errors} update={update} attendanceLabel={roleConfig?.attendanceLabel} />
          ) : (
            <StepNumbers draft={draft} errors={errors} update={update} compact />
          )}

        </FormSection>

        {config.people === "met" ? (
          <FormSection title="Contacts" badge="Optional">
            <StepPeople draft={draft} errors={errors} update={update} compact />
            
          </FormSection>
        ) : null}

        {isMeeting && role === "leader" ? (
          <FormSection title="What was taught" >
            <Field id={taughtId} label="Topic or passage (optional)" error={errors.taught}>
              <input
                {...fieldAria(taughtId, errors.taught)}
                value={taught}
                maxLength={MEETING_TAUGHT_MAX}
                onChange={(event) => setTaught(event.target.value)}
                placeholder="John 6: the bread of life"
                className={inputClass}
              />
            </Field>
          </FormSection>
        ) : null}

        <FormSection title="Note" badge="Optional">
          <Field id={noteId} label="Anything to add" error={errors.note}>
            <textarea
              {...fieldAria(noteId, errors.note)}
              rows={3}
              value={draft.note}
              onChange={(event) => update({ note: event.target.value })}
              className={textareaClass}
            />
          </Field>
        </FormSection>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-(--color-line) bg-(--color-surface-muted)/60 px-4 py-3.5 sm:px-6">
        <button type="button" onClick={onBack} className={buttonSecondary}>
          Back
        </button>
        <button type="submit" className={buttonPrimary}>
          {existing ? "Save changes" : "Save activity"}
        </button>
      </div>
    </form>
  );
}

/** "today", "yesterday" or "Wed 7 Oct". */
export function forDay(day: string, today: string): string {
  const when = relativeDay(day, today);
  return when === "Today" || when === "Yesterday" ? when.toLowerCase() : when;
}

function FormSection({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="flex items-center gap-2 text-[14px] font-medium text-(--color-text-strong)">
        {title}
        {badge ? <Badge tone={badge === "Optional" ? "neutral" : "preview"}>{badge}</Badge> : null}
      </h3>
      {children}
    </section>
  );
}

/** Meeting numbers with the attendance label set by the reporting role. */
function MeetingNumbers({
  draft,
  errors,
  update,
  attendanceLabel,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  update: (patch: Partial<ActivityDraft>) => void;
  attendanceLabel?: string;
}) {
  if (!draft.kind) return null;
  const rules = activityFields(draft.kind, draft.mode);
  return (
    <div className="grid grid-cols-2 gap-3">
      {rules.shown.map((key) => {
        const id = fieldId(`numbers.${key}`);
        const error = errors[`numbers.${key}`];
        const required = rules.required.includes(key);
        const label = key === "attendance" && attendanceLabel ? attendanceLabel : ministryFieldLabel(key);
        return (
          <Field key={key} id={id} label={`${label}${required ? " *" : ""}`} error={error}>
            <input
              {...fieldAria(id, error)}
              type="number"
              inputMode="numeric"
              min={0}
              max={MINISTRY_COUNT_MAX}
              step={1}
              value={draft.numbers[key]}
              onChange={(event) => update({ numbers: { ...draft.numbers, [key]: event.target.value } })}
              placeholder="0"
              className={inputClass}
            />
          </Field>
        );
      })}
    </div>
  );
}
