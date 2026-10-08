"use client";

import { ChevronDownIcon } from "lucide-react";

import { fieldId, type ActivityDraft, type StepErrors } from "@/lib/community/activity-form";
import {
  ACTIVITY_PLACE_MAX,
  ACTIVITY_TITLE_MAX,
  OUTREACH_MODES,
  OUTREACH_PLATFORMS,
  activityKindConfig,
} from "@/lib/community/ministry-activities";

import { ChoiceGroup } from "../choice-chips";
import { errorText, inputClass, selectClass } from "../styles";
import { Field, fieldAria } from "./field";

/** Step 2: how an outreach reached people, or what a meeting was called and where. */
export function StepWhere({
  draft,
  errors,
  update,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  update: (patch: Partial<ActivityDraft>) => void;
}) {
  if (!draft.kind) return null;
  const config = activityKindConfig(draft.kind);

  if (config.key === "outreach") {
    const modeId = fieldId("mode");
    const platformId = fieldId("platform");
    const otherId = fieldId("platformOther");
    const locationId = fieldId("location");
    const online = draft.mode === "online" || draft.mode === "both";
    const offline = draft.mode === "offline" || draft.mode === "both";

    return (
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <p className="text-[13px] font-medium text-zinc-700">How did you reach people? *</p>
          <ChoiceGroup
            id={modeId}
            name="mode"
            label="How did you reach people?"
            layout="segmented"
            value={draft.mode}
            onChange={(mode) =>
              update({ mode, ...(mode === "offline" ? { platform: "", platformOther: "" } : {}) })
            }
            invalid={Boolean(errors.mode)}
            describedBy={errors.mode ? `${modeId}-error` : undefined}
            options={OUTREACH_MODES}
          />
          {errors.mode ? (
            <p id={`${modeId}-error`} className={errorText}>
              {errors.mode}
            </p>
          ) : null}
        </div>

        {online ? (
          <Field id={platformId} label="Platform *" error={errors.platform}>
            <div className="relative">
              <select
                {...fieldAria(platformId, errors.platform)}
                value={draft.platform}
                onChange={(event) => update({ platform: event.target.value })}
                className={`${selectClass} ${
                  draft.platform ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                <option value="">Choose a platform</option>
                {OUTREACH_PLATFORMS.map((platform) => (
                  <option key={platform.key} value={platform.key}>
                    {platform.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 ${
                  draft.platform ? "text-(--color-brand-blue)" : "text-zinc-400"
                }`}
                strokeWidth={2}
                aria-hidden
              />
            </div>
          </Field>
        ) : null}

        {online && draft.platform === "other" ? (
          <Field id={otherId} label="Which platform? *" error={errors.platformOther}>
            <input
              {...fieldAria(otherId, errors.platformOther)}
              value={draft.platformOther}
              onChange={(event) => update({ platformOther: event.target.value })}
              maxLength={ACTIVITY_PLACE_MAX}
              placeholder="Zoom, a church app…"
              className={inputClass}
            />
          </Field>
        ) : null}

        {offline ? (
          <Field id={locationId} label="Where were you? *" error={errors.location}>
            <input
              {...fieldAria(locationId, errors.location)}
              value={draft.location}
              onChange={(event) => update({ location: event.target.value })}
              maxLength={ACTIVITY_PLACE_MAX}
              placeholder="Ikeja market, a hospital ward…"
              className={inputClass}
            />
          </Field>
        ) : null}
      </div>
    );
  }

  const titleId = fieldId("title");
  const locationId = fieldId("location");
  return (
    <div className="grid gap-4">
      {config.titleLabel ? (
        <Field
          id={titleId}
          label={`${config.titleLabel}${config.titleRequired ? " *" : " (optional)"}`}
          error={errors.title}
        >
          <input
            {...fieldAria(titleId, errors.title)}
            value={draft.title}
            onChange={(event) => update({ title: event.target.value })}
            maxLength={ACTIVITY_TITLE_MAX}
            placeholder={
              config.key === "other" ? "Hospital visitation, a wedding…" : "Tuesday Bible study"
            }
            className={inputClass}
          />
        </Field>
      ) : null}
      {config.asksLocation ? (
        <Field id={locationId} label="Where (optional)" error={errors.location}>
          <input
            {...fieldAria(locationId, errors.location)}
            value={draft.location}
            onChange={(event) => update({ location: event.target.value })}
            maxLength={ACTIVITY_PLACE_MAX}
            placeholder="Church hall, online…"
            className={inputClass}
          />
        </Field>
      ) : null}
    </div>
  );
}
