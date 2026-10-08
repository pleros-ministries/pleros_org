"use client";

import { useEffect, useState } from "react";

import { DetailGrid } from "@/components/ppc/expandable-table-row";
import {
  DISCIPLESHIP_STATUSES,
  DISCIPLESHIP_STATUS_LABELS,
  FOLLOW_UP_PLAN_MAX,
  INTERACTION_KINDS,
  INTERACTION_KIND_LABELS,
  INTERACTION_NOTE_MAX,
  SALVATION_STATUSES,
  SALVATION_STATUS_LABELS,
  canDeleteInteraction,
  outcomesLabel,
  type DiscipleshipStatus,
  type LoggableInteractionKind,
  type SalvationStatus,
} from "@/lib/community/outreach-contacts";
import { dateKeyLabel } from "@/lib/community/time";
import type {
  ContactInteraction,
  OutreachContact,
} from "@/lib/db/queries/outreach-contacts";
import {
  addContactInteractionAction,
  deleteContactInteractionAction,
  getContactDetailAction,
  updateContactAction,
} from "@/app/(site)/dashboard/community/_actions/outreach-actions";

import { ChoiceGroup, ToggleChip } from "./choice-chips";
import { errorText, inputClass, selectClass } from "./styles";
import { useReportAction } from "./use-report-action";

/** Who is looking, so the history shows Delete only where it will work. */
export type ContactViewer = { userId: string; isAdmin: boolean };

const followedUpFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
});

const smallPrimary =
  "inline-flex h-9 items-center rounded-full bg-(--color-brand-blue) px-3.5 text-xs font-semibold text-white disabled:opacity-60";
const compactInput = `${inputClass} h-9 text-base sm:text-sm`;

/** Logs a call, visit or message with a person, with what happened. */
export function LogFollowUpForm({
  contact,
  today,
  onDone,
  onCancel,
}: {
  contact: OutreachContact;
  today: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { run, pending, error } = useReportAction();
  const [kind, setKind] = useState<LoggableInteractionKind>("call");
  const [date, setDate] = useState(today);
  const [saved, setSaved] = useState(false);
  const [filled, setFilled] = useState(false);
  const [healed, setHealed] = useState(false);
  const [note, setNote] = useState("");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () =>
            addContactInteractionAction({
              contactId: contact.id,
              kind,
              dateKey: date,
              saved,
              filled,
              healed,
              note,
            }),
          { onDone },
        );
      }}
      className="grid gap-2.5 rounded-xl border border-zinc-200 p-3"
    >
      <p className="text-xs font-medium text-zinc-700">Log a follow-up with {contact.name}</p>
      <ChoiceGroup
        name={`log-kind-${contact.id}`}
        label="How you reached them"
        layout="chips"
        value={kind}
        onChange={setKind}
        options={INTERACTION_KINDS}
      />
      <div className="flex flex-wrap gap-2">
        <ToggleChip label="Saved" checked={saved} onChange={setSaved} />
        <ToggleChip label="Filled" checked={filled} onChange={setFilled} />
        <ToggleChip label="Healed" checked={healed} onChange={setHealed} />
      </div>
      <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          When
          <input
            type="date"
            value={date}
            max={today}
            onChange={(event) => setDate(event.target.value)}
            className={compactInput}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Note (optional)
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={INTERACTION_NOTE_MAX}
            placeholder="How did it go?"
            className={compactInput}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className={errorText}>
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={smallPrimary}>
          {pending ? "Saving…" : "Save follow-up"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-zinc-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Changes a person's statuses, plan and next follow-up date. */
export function EditDetailsForm({
  contact,
  onDone,
  onCancel,
}: {
  contact: OutreachContact;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { run, pending, error } = useReportAction();
  const [salvation, setSalvation] = useState<SalvationStatus>(contact.salvationStatus);
  const [discipleship, setDiscipleship] = useState<DiscipleshipStatus>(
    contact.discipleshipStatus,
  );
  const [plan, setPlan] = useState(contact.followUpPlan ?? "");
  const [next, setNext] = useState(contact.nextFollowUpDate ?? "");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () =>
            updateContactAction({
              contactId: contact.id,
              salvationStatus: salvation,
              discipleshipStatus: discipleship,
              followUpPlan: plan,
              nextFollowUpDate: next,
            }),
          { onDone },
        );
      }}
      className="grid gap-2.5 rounded-xl border border-zinc-200 p-3"
    >
      <p className="text-xs font-medium text-zinc-700">Details for {contact.name}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Salvation
          <select
            value={salvation}
            onChange={(event) => setSalvation(event.target.value as SalvationStatus)}
            className={`${selectClass} h-9 text-base sm:text-sm`}
          >
            {SALVATION_STATUSES.map((status) => (
              <option key={status.key} value={status.key}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Discipleship
          <select
            value={discipleship}
            onChange={(event) => setDiscipleship(event.target.value as DiscipleshipStatus)}
            className={`${selectClass} h-9 text-base sm:text-sm`}
          >
            {DISCIPLESHIP_STATUSES.map((status) => (
              <option key={status.key} value={status.key}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600 sm:col-span-2">
          Follow-up plan (optional)
          <input
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            maxLength={FOLLOW_UP_PLAN_MAX}
            placeholder="Invite to Sunday service, send the welcome pack…"
            className={compactInput}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Next follow-up (optional)
          <input
            type="date"
            value={next}
            onChange={(event) => setNext(event.target.value)}
            className={compactInput}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className={errorText}>
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={smallPrimary}>
          {pending ? "Saving…" : "Save details"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-zinc-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** The person's statuses and every touch so far, loaded when the row is opened. */
export function ContactDetail({
  id,
  contact,
  viewer,
  version,
}: {
  id: string;
  contact: OutreachContact;
  viewer: ContactViewer | null;
  /** Bumped by the row after a change, so the history reloads. */
  version: number;
}) {
  const { run, pending, error } = useReportAction();
  const [interactions, setInteractions] = useState<ContactInteraction[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getContactDetailAction(contact.id)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setLoadError(result.error);
          return;
        }
        setLoadError(null);
        setInteractions(result.detail.interactions);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load their history. Try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [contact.id, version]);

  return (
    <div id={id} className="grid gap-2.5 border-t border-zinc-100 pt-2.5 text-xs">
      <DetailGrid
        items={[
          ["Salvation", SALVATION_STATUS_LABELS[contact.salvationStatus]],
          ["Discipleship", DISCIPLESHIP_STATUS_LABELS[contact.discipleshipStatus]],
          [
            "Next follow-up",
            contact.nextFollowUpDate ? dateKeyLabel(contact.nextFollowUpDate) : "Not set",
          ],
          [
            "First followed up",
            contact.followedUpAt
              ? `${followedUpFmt.format(new Date(contact.followedUpAt))}${
                  contact.followedUpByName ? ` by ${contact.followedUpByName}` : ""
                }`
              : "Not yet",
          ],
        ]}
      />
      {contact.followUpPlan ? (
        <p className="text-zinc-700">
          <span className="font-medium">Plan:</span> {contact.followUpPlan}
        </p>
      ) : null}
      <div className="grid gap-1">
        <p className="font-medium text-zinc-700">History</p>
        {loadError ? (
          <p className={errorText}>{loadError}</p>
        ) : interactions === null ? (
          <p className="text-zinc-500">Loading…</p>
        ) : interactions.length === 0 ? (
          <p className="text-zinc-500">Nothing logged yet.</p>
        ) : (
          <ol className="divide-y divide-zinc-100 rounded-sm border border-zinc-200">
            {interactions.map((item) => {
              const outcomes = outcomesLabel(item.outcomes);
              const deletable = viewer ? canDeleteInteraction(viewer, item) : false;
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 px-2.5 py-2">
                  <p className="min-w-0 text-zinc-700">
                    <span className="font-medium text-zinc-900">
                      {dateKeyLabel(item.interactionDate)} · {INTERACTION_KIND_LABELS[item.kind]}
                    </span>
                    {item.activity ? ` · ${item.activity.summary}` : ""}
                    {outcomes ? ` · ${outcomes}` : ""}
                    {item.note ? ` · ${item.note}` : ""}
                    {item.userName ? (
                      <span className="text-zinc-500"> · by {item.userName}</span>
                    ) : null}
                  </p>
                  {deletable ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm("Delete this entry from their history?")) {
                          run(() => deleteContactInteractionAction(item.id), {
                            onDone: () =>
                              setInteractions((current) =>
                                current?.filter((entry) => entry.id !== item.id) ?? null,
                              ),
                          });
                        }
                      }}
                      className="shrink-0 text-red-700 underline underline-offset-2 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
        {error ? (
          <p role="alert" className={errorText}>
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
