"use client";

import { useState } from "react";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";

import {
  fieldId,
  type ActivityDraft,
  type FollowUpPick,
  type StepErrors,
} from "@/lib/community/activity-form";
import {
  CONTACTS_PER_DAY_MAX,
  INTERACTION_KINDS,
  INTERACTION_NOTE_MAX,
  SALVATION_STATUS_LABELS,
  filterAndSortContacts,
  type LoggableInteractionKind,
  type SalvationStatus,
} from "@/lib/community/outreach-contacts";
import { dateKeyLabel } from "@/lib/community/time";

import { ChoiceGroup, ToggleChip } from "../choice-chips";
import { errorText, inputClass } from "../styles";

/** One of the member's people, as the follow-up step offers them. */
export type FollowUpCandidate = {
  id: number;
  name: string;
  phone: string | null;
  note: string | null;
  metDate: string;
  followedUpAt: string | null;
  salvationStatus: SalvationStatus;
};

const RESULT_LIMIT = 20;

/** Step 2 of a follow-up: which existing people were followed up, how, and what happened. */
export function StepFollowUps({
  draft,
  errors,
  update,
  contacts,
}: {
  draft: ActivityDraft;
  errors: StepErrors;
  update: (patch: Partial<ActivityDraft>) => void;
  contacts: FollowUpCandidate[];
}) {
  const [query, setQuery] = useState("");
  const picks = draft.followUps;
  const picked = new Set(picks.map((row) => row.contactId));
  const matches = filterAndSortContacts(
    contacts.filter((contact) => !picked.has(contact.id)),
    { query, status: "all", sort: "newest" },
  );
  const results = matches.slice(0, RESULT_LIMIT);

  function add(contact: FollowUpCandidate) {
    if (picks.length >= CONTACTS_PER_DAY_MAX) return;
    const pick: FollowUpPick = {
      contactId: contact.id,
      name: contact.name,
      phone: contact.phone,
      kind: "call",
      saved: false,
      filled: false,
      healed: false,
      note: "",
    };
    update({ followUps: [...picks, pick] });
  }

  function updatePick(contactId: number, change: Partial<FollowUpPick>) {
    update({
      followUps: picks.map((row) =>
        row.contactId === contactId ? { ...row, ...change } : row,
      ),
    });
  }

  if (contacts.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        You have not recorded anyone yet. People you add in an outreach appear
        here.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-0.5">
        <p className="text-[13px] font-medium text-zinc-700">Who did you follow up?</p>
        <p className="text-xs text-zinc-500">
          Pick each person, say how you reached them and what happened.
        </p>
      </div>

      {errors.followUps ? (
        <p role="alert" className={errorText}>
          {errors.followUps}
        </p>
      ) : null}

      {picks.length > 0 ? (
        <ul className="grid gap-2">
          {picks.map((row) => {
            const id = fieldId(`followUps.${row.contactId}`);
            const error = errors[`followUps.${row.contactId}`];
            return (
              <li
                key={row.contactId}
                id={id}
                tabIndex={-1}
                className={`grid gap-2.5 rounded-xl border p-3 outline-none ${
                  error ? "border-[var(--destructive)] ring-4 ring-red-100" : "border-zinc-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium text-zinc-900">
                    {row.name}
                    {row.phone ? (
                      <span className="font-normal text-zinc-500"> · {row.phone}</span>
                    ) : null}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        followUps: picks.filter((item) => item.contactId !== row.contactId),
                      })
                    }
                    aria-label={`Remove ${row.name}`}
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <XIcon className="size-4" strokeWidth={2} />
                  </button>
                </div>
                <ChoiceGroup
                  name={`kind-${row.contactId}`}
                  label={`How you reached ${row.name}`}
                  layout="chips"
                  value={row.kind}
                  onChange={(kind: LoggableInteractionKind) => updatePick(row.contactId, { kind })}
                  options={INTERACTION_KINDS}
                />
                <div className="flex flex-wrap gap-2">
                  <ToggleChip
                    label="Saved"
                    checked={row.saved}
                    onChange={(saved) => updatePick(row.contactId, { saved })}
                  />
                  <ToggleChip
                    label="Filled"
                    checked={row.filled}
                    onChange={(filled) => updatePick(row.contactId, { filled })}
                  />
                  <ToggleChip
                    label="Healed"
                    checked={row.healed}
                    onChange={(healed) => updatePick(row.contactId, { healed })}
                  />
                </div>
                <input
                  value={row.note}
                  onChange={(event) => updatePick(row.contactId, { note: event.target.value })}
                  maxLength={INTERACTION_NOTE_MAX}
                  placeholder="How did it go? (optional)"
                  aria-label={`Note for ${row.name}`}
                  className={inputClass}
                />
                {error ? <p className={errorText}>{error}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="grid gap-2 border-t border-zinc-100 pt-3">
        <label className="relative block">
          <span className="sr-only">Search your people</span>
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={2}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your people"
            className={`${inputClass} pl-9`}
          />
        </label>
        {results.length === 0 ? (
          <p className="text-xs text-zinc-500">
            {matches.length === 0 && picked.size === contacts.length
              ? "Everyone on your list is picked."
              : "No one matches that search."}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {results.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="grid min-w-0">
                  <span className="truncate font-medium text-zinc-900">{contact.name}</span>
                  <span className="truncate text-xs text-zinc-500">
                    {[
                      contact.phone,
                      `Met ${dateKeyLabel(contact.metDate)}`,
                      contact.salvationStatus !== "unknown"
                        ? SALVATION_STATUS_LABELS[contact.salvationStatus]
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => add(contact)}
                  disabled={picks.length >= CONTACTS_PER_DAY_MAX}
                  className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-(--color-brand-blue) px-3 text-xs font-semibold text-(--color-brand-blue) disabled:opacity-50"
                >
                  <PlusIcon className="size-3.5" strokeWidth={2} />
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
        {matches.length > RESULT_LIMIT ? (
          <p className="text-xs text-zinc-500">Search to find more people.</p>
        ) : null}
      </div>
    </div>
  );
}
