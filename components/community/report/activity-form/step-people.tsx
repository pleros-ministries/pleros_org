"use client";

import { PlusIcon, XIcon } from "lucide-react";

import {
  blankPerson,
  fieldId,
  savedMismatch,
  type ActivityDraft,
  type PersonDraft,
  type StepErrors,
} from "@/lib/community/activity-form";
import {
  CONTACTS_PER_DAY_MAX,
  CONTACT_NAME_MAX,
  CONTACT_NOTE_MAX,
  CONTACT_PHONE_MAX,
} from "@/lib/community/outreach-contacts";

import { ToggleChip } from "../choice-chips";
import { errorText, inputClass, smallOutlineButton } from "../styles";

function newKey(): string {
  return `added-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Step 4 of an outreach: the people met, each with what happened for them. */
export function StepPeople({
  draft,
  errors,
  update,
  compact = false,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  update: (patch: Partial<ActivityDraft>) => void;
  compact?: boolean;
}) {
  const rows = draft.people;
  const entered = Number(draft.numbers.saved.trim() || "0");
  const mismatch = savedMismatch(draft);

  function updateRow(key: string, change: Partial<PersonDraft>) {
    update({ people: rows.map((row) => (row.key === key ? { ...row, ...change } : row)) });
  }

  function removeRow(row: PersonDraft) {
    if (
      row.id !== null &&
      !window.confirm(
        `Remove ${row.name || "this person"}? They will leave your People list when you save.`,
      )
    ) {
      return;
    }
    update({ people: rows.filter((item) => item.key !== row.key) });
  }

  return (
    <div className="grid gap-3">
      {!compact ? <div className="grid gap-0.5">
        <p className="text-[13px] font-medium text-zinc-700">People you met (optional)</p>
        <p className="text-xs text-zinc-500">
          Add anyone you want to follow up. Only you, your pastor and the Pleros
          team see these names and numbers.
        </p>
      </div> : null}

      {entered > 0 && !compact ? (
        <p className="text-xs text-zinc-600">
          You entered {entered} saved. Tick Saved on each person below if you know who.
        </p>
      ) : null}
      {mismatch ? <p className="text-xs text-amber-700">{mismatch}</p> : null}
      {errors.people ? (
        <p role="alert" className={errorText}>
          {errors.people}
        </p>
      ) : null}

      {rows.map((row, index) => {
        const id = fieldId(`people.${row.key}`);
        const error = errors[`people.${row.key}`];
        return (
          <div
            key={row.key}
            id={id}
            tabIndex={-1}
            className={`grid gap-2 rounded-xl border p-3 outline-none ${
              error ? "border-[var(--destructive)] ring-4 ring-red-100" : "border-zinc-200"
            }`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="order-1 grid gap-1 text-xs font-medium text-zinc-600">
                Name
                <input
                  value={row.name}
                  onChange={(event) => updateRow(row.key, { name: event.target.value })}
                  maxLength={CONTACT_NAME_MAX}
                  className={inputClass}
                />
              </label>
              <label className="order-3 col-span-2 grid gap-1 text-xs font-medium text-zinc-600 sm:order-2 sm:col-span-1">
                Phone number (optional)
                <input
                  type="tel"
                  inputMode="tel"
                  value={row.phone}
                  onChange={(event) => updateRow(row.key, { phone: event.target.value })}
                  maxLength={CONTACT_PHONE_MAX}
                  className={inputClass}
                />
              </label>
              <label className="order-4 col-span-2 grid gap-1 text-xs font-medium text-zinc-600">
                Note (optional)
                <input
                  value={row.note}
                  onChange={(event) => updateRow(row.key, { note: event.target.value })}
                  maxLength={CONTACT_NOTE_MAX}
                  placeholder="Where you met, what to follow up on…"
                  className={inputClass}
                />
              </label>
              {/* Last in the markup so it follows the fields when tabbing; placed beside them by `order`. */}
              <button
                type="button"
                onClick={() => removeRow(row)}
                aria-label={`Remove person ${index + 1}`}
                className="order-2 inline-flex size-11 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 sm:order-3"
              >
                <XIcon className="size-4" strokeWidth={2} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="Saved"
                checked={row.saved}
                onChange={(saved) => updateRow(row.key, { saved })}
              />
              <ToggleChip
                label="Filled"
                checked={row.filled}
                onChange={(filled) => updateRow(row.key, { filled })}
              />
              <ToggleChip
                label="Healed"
                checked={row.healed}
                onChange={(healed) => updateRow(row.key, { healed })}
              />
              <ToggleChip
                label="Wants follow-up"
                checked={row.wantsFollowUp}
                onChange={(wantsFollowUp) => updateRow(row.key, { wantsFollowUp })}
              />
            </div>
            {error ? <p className={errorText}>{error}</p> : null}
          </div>
        );
      })}

      {rows.length < CONTACTS_PER_DAY_MAX ? (
        <button
          type="button"
          onClick={() => update({ people: [...rows, blankPerson(newKey())] })}
          className={`${smallOutlineButton} w-fit`}
        >
          <PlusIcon className="size-4" strokeWidth={2} />
          {rows.length === 0 ? "Add a person" : "Add another person"}
        </button>
      ) : null}
    </div>
  );
}
