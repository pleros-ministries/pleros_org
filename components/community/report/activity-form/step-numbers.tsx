"use client";

import { fieldId, type ActivityDraft, type StepErrors } from "@/lib/community/activity-form";
import { activityFields } from "@/lib/community/ministry-activities";
import {
  MINISTRY_COUNT_MAX,
  ministryFieldLabel,
} from "@/lib/community/ministry-report";

import { inputClass } from "../styles";
import { Field, fieldAria } from "./field";

/** Step 3: only the numbers this kind of activity asks for. */
export function StepNumbers({
  draft,
  errors,
  update,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  update: (patch: Partial<ActivityDraft>) => void;
}) {
  if (!draft.kind) return null;
  const rules = activityFields(draft.kind, draft.mode);

  return (
    <div className="grid gap-4">
      <p className="text-xs text-zinc-500">
        {draft.kind === "follow_up"
          ? "Filled in from the people you picked. Change them if you followed up more people than you named."
          : "Use 0 if there were none. Required fields are marked *."}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {rules.shown.map((key) => {
          const id = fieldId(`numbers.${key}`);
          const error = errors[`numbers.${key}`];
          const required = rules.required.includes(key);
          return (
            <Field
              key={key}
              id={id}
              label={`${ministryFieldLabel(key)}${required ? " *" : ""}`}
              error={error}
            >
              <input
                {...fieldAria(id, error)}
                type="number"
                inputMode="numeric"
                min={0}
                max={MINISTRY_COUNT_MAX}
                step={1}
                value={draft.numbers[key]}
                onChange={(event) =>
                  update({ numbers: { ...draft.numbers, [key]: event.target.value } })
                }
                placeholder="0"
                className={inputClass}
              />
            </Field>
          );
        })}
      </div>
    </div>
  );
}
