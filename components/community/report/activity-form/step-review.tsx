"use client";

import {
  activityKeyNumbers,
  activityTitle,
  activityWhere,
  fieldId,
  type ActivityDraft,
  type StepErrors,
  type StepId,
} from "@/lib/community/activity-form";
import { activityFields, activityKindConfig } from "@/lib/community/ministry-activities";
import {
  MINISTRY_NOTE_MAX,
  emptyMinistryNumbers,
  ministryFieldLabel,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";

import { textLink, textareaClass } from "../styles";
import { Field, fieldAria } from "./field";

/** The draft's numbers as numbers, blanks as 0, for the summary line. */
function draftNumbers(draft: ActivityDraft): MinistryNumbers {
  const numbers = emptyMinistryNumbers();
  for (const key of Object.keys(numbers) as Array<keyof MinistryNumbers>) {
    const value = Number(draft.numbers[key].trim());
    numbers[key] = Number.isInteger(value) && value >= 0 ? value : 0;
  }
  return numbers;
}

/** The last step: what will be saved, and an optional note. */
export function StepReview({
  draft,
  errors,
  update,
  onJump,
  stepIndex,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  update: (patch: Partial<ActivityDraft>) => void;
  onJump: (step: StepId) => void;
  /** Which steps this kind has, so an "Edit" link only appears for steps that exist. */
  stepIndex: (step: StepId) => number;
}) {
  if (!draft.kind) return null;
  const config = activityKindConfig(draft.kind);
  const kind = draft.kind;
  const numbers = draftNumbers(draft);
  const rules = activityFields(kind, draft.mode);
  const where = activityWhere({
    mode: draft.mode,
    platform:
      draft.platform === "other" ? `other:${draft.platformOther.trim()}` : draft.platform || null,
    location: draft.location.trim() || null,
  });
  const noteId = fieldId("note");
  const remaining = MINISTRY_NOTE_MAX - draft.note.length;

  const people =
    config.people === "met"
      ? (() => {
          const named = draft.people.filter((person) => person.name.trim() !== "");
          if (named.length === 0) return "No one added";
          const saved = named.filter((person) => person.saved).length;
          const follow = named.filter((person) => person.wantsFollowUp).length;
          return [
            `${named.length} added`,
            saved > 0 ? `${saved} saved` : null,
            follow > 0 ? `${follow} to follow up` : null,
          ]
            .filter(Boolean)
            .join(" · ");
        })()
      : config.people === "follow_up"
        ? draft.followUps.length === 0
          ? "No one picked"
          : `${draft.followUps.length} followed up`
        : null;

  const rows: Array<{ label: string; value: string; step: StepId }> = [
    { label: "What", value: activityTitle({ kind, title: draft.title.trim() || null }), step: "kind" },
    ...(stepIndex("where") >= 0
      ? [{ label: "Where", value: where ?? "Not given", step: "where" as StepId }]
      : []),
    {
      label: "Numbers",
      value:
        rules.shown
          .filter((key) => rules.required.includes(key) || numbers[key] > 0)
          .map((key) => `${ministryFieldLabel(key)}: ${numbers[key]}`)
          .join(" · ") || activityKeyNumbers({ ...numbers, kind }),
      step: "numbers",
    },
    ...(people !== null ? [{ label: "People", value: people, step: "people" as StepId }] : []),
  ];

  return (
    <div className="grid gap-5">
      <dl className="grid gap-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5">
            <dt className="text-xs font-medium text-zinc-500">{row.label}</dt>
            <dd className="text-sm text-zinc-900">{row.value}</dd>
            <dd>
              {row.step === "kind" && stepIndex("kind") < 0 ? null : (
                <button
                  type="button"
                  onClick={() => onJump(row.step)}
                  className={textLink}
                  aria-label={`Edit ${row.label.toLowerCase()}`}
                >
                  Edit
                </button>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <Field id={noteId} label="Anything else to note? (optional)" error={errors.note}>
        <textarea
          {...fieldAria(noteId, errors.note)}
          value={draft.note}
          onChange={(event) => update({ note: event.target.value })}
          rows={3}
          maxLength={MINISTRY_NOTE_MAX}
          placeholder="Who you ministered to, what stood out…"
          className={textareaClass}
        />
        {remaining <= 50 ? (
          <span className="text-xs font-normal text-zinc-500">{remaining} left</span>
        ) : null}
      </Field>
    </div>
  );
}
