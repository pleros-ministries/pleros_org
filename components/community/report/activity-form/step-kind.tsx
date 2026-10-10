"use client";

import { fieldId, type ActivityDraft, type StepErrors } from "@/lib/community/activity-form";
import {
  ACTIVITY_KINDS,
  activityKindConfig,
  type ActivityKind,
} from "@/lib/community/ministry-activities";

import { ActivityKindIcon } from "../activity-kind-icon";
import { ChoiceGroup } from "../choice-chips";
import { errorText } from "../styles";

/** Step 1: which kind of activity this is. Locked once saved. */
export function StepKind({
  draft,
  errors,
  onChoose,
  locked,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  onChoose: (kind: ActivityKind) => void;
  locked: boolean;
}) {
  if (locked && draft.kind) {
    const config = activityKindConfig(draft.kind);
    return (
      <div className="grid gap-3">
        <div className="flex items-start gap-3 rounded-xl border border-(--color-brand-blue) bg-(--color-brand-sky-soft) p-3">
          <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-(--color-brand-blue) ring-1 ring-zinc-200">
            <ActivityKindIcon kind={config.key} />
          </span>
          <span className="grid gap-0.5">
            <span className="text-sm font-medium text-zinc-900">{config.label}</span>
            <span className="text-xs text-zinc-500">{config.hint}</span>
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          To change the kind, remove this activity and add it again.
        </p>
      </div>
    );
  }

  const id = fieldId("kind");
  return (
    <div className="grid gap-2">
      <ChoiceGroup
        id={id}
        name="kind"
        label="What did you do?"
        layout="cards"
        value={draft.kind}
        onChange={onChoose}
        onReselect={onChoose}
        invalid={Boolean(errors.kind)}
        describedBy={errors.kind ? `${id}-error` : undefined}
        options={ACTIVITY_KINDS.map((kind) => ({
          key: kind.key,
          label: kind.label,
          hint: kind.hint,
          icon: <ActivityKindIcon kind={kind.key} />,
        }))}
      />
      {errors.kind ? (
        <p id={`${id}-error`} className={errorText}>
          {errors.kind}
        </p>
      ) : null}
    </div>
  );
}
