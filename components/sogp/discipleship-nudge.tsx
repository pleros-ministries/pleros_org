"use client";

import { HandHeartIcon, NotebookPenIcon } from "lucide-react";
import { useState } from "react";

import {
  logContactAction,
  sendNudgeAction,
} from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import type { DiscipleSummary } from "@/lib/db/queries/sogp-discipleship";
import {
  DISCIPLESHIP_CONTACT_NOTE_MAX_LENGTH,
  DISCIPLESHIP_CONTACT_STALE_DAYS,
  DISCIPLESHIP_MANUAL_CONTACT_KINDS,
  DISCIPLESHIP_NUDGES,
  DISCIPLESHIP_NUDGE_NOTE_MAX_LENGTH,
  type DiscipleshipManualContactKind,
} from "@/lib/sogp/discipleship";

import { formatDiscipleshipDate, useDiscipleshipAction } from "./discipleship-check-ins";

const DAY_MS = 24 * 60 * 60 * 1000;

const CONTACT_LABELS: Record<DiscipleSummary["recentContacts"][number]["kind"], string> = {
  nudge: "Encouragement",
  whatsapp: "WhatsApp",
  call: "Call",
  visit: "Visit",
  message: "Message",
  note: "Note",
};

const inputClass =
  "w-full rounded-sm border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-[var(--color-brand-blue)] focus-visible:outline-none sm:text-sm";
const primaryButtonClass =
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-blue)] px-3.5 text-xs font-medium text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60";
const toggleButtonClass =
  "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-[0.98] disabled:opacity-60";

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);
}

/** "Last reached out 3 days ago · 5 times", amber once contact goes stale. */
export function LastContactLine({ disciple }: { disciple: DiscipleSummary }) {
  if (!disciple.lastContactedAt) {
    return <p className="text-[0.7rem] text-amber-700">You haven&apos;t reached out yet</p>;
  }
  const days = daysSince(disciple.lastContactedAt);
  const when = days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  const stale = days >= DISCIPLESHIP_CONTACT_STALE_DAYS;
  return (
    <p className={`text-[0.7rem] ${stale ? "text-amber-700" : "text-zinc-500"}`}>
      Last reached out {when} · {disciple.contactCount} time{disciple.contactCount === 1 ? "" : "s"}
    </p>
  );
}

export function DiscipleFollowUp({
  disciple,
  preview,
}: {
  disciple: DiscipleSummary;
  preview: boolean;
}) {
  const [panel, setPanel] = useState<"encourage" | "log" | null>(null);
  const [sentToday, setSentToday] = useState(disciple.nudgedToday);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={sentToday}
          aria-expanded={panel === "encourage"}
          onClick={() => setPanel(panel === "encourage" ? null : "encourage")}
          className={toggleButtonClass}
        >
          <HandHeartIcon className="size-3.5 text-[var(--color-brand-blue)]" strokeWidth={2} />
          {sentToday ? "Encouraged today" : "Encourage"}
        </button>
        <button
          type="button"
          aria-expanded={panel === "log"}
          onClick={() => setPanel(panel === "log" ? null : "log")}
          className={toggleButtonClass}
        >
          <NotebookPenIcon className="size-3.5 text-[var(--color-brand-blue)]" strokeWidth={2} />
          Follow-up log
        </button>
      </div>
      {panel === "encourage" ? (
        <EncouragePanel
          disciple={disciple}
          preview={preview}
          onSent={() => {
            setSentToday(true);
            setPanel(null);
          }}
        />
      ) : null}
      {panel === "log" ? <ContactLogPanel disciple={disciple} preview={preview} /> : null}
    </div>
  );
}

function EncouragePanel({
  disciple,
  preview,
  onSent,
}: {
  disciple: DiscipleSummary;
  preview: boolean;
  onSent: () => void;
}) {
  const [nudgeKey, setNudgeKey] = useState<string>(DISCIPLESHIP_NUDGES[0].key);
  const [note, setNote] = useState("");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <form
      className="grid gap-2 rounded-sm bg-zinc-50 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () =>
            sendNudgeAction({ membershipId: disciple.membershipId, nudgeKey, personalNote: note }),
          onSent,
        );
      }}
    >
      <fieldset className="grid gap-1.5">
        <legend className="mb-1 text-xs font-medium text-zinc-900">
          Send {disciple.firstName} an encouragement
        </legend>
        {DISCIPLESHIP_NUDGES.map((nudge) => (
          <label key={nudge.key} className="flex items-start gap-2 text-xs text-zinc-700">
            <input
              type="radio"
              name={`nudge-${disciple.membershipId}`}
              value={nudge.key}
              checked={nudgeKey === nudge.key}
              onChange={() => setNudgeKey(nudge.key)}
              className="mt-0.5 accent-[var(--color-brand-blue)]"
            />
            {nudge.text}
          </label>
        ))}
      </fieldset>
      <input
        type="text"
        value={note}
        maxLength={DISCIPLESHIP_NUDGE_NOTE_MAX_LENGTH}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add a personal line (optional)"
        aria-label="Personal line"
        className={inputClass}
      />
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.7rem] text-zinc-400">Sent as a notification. One a day.</p>
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          Send
        </button>
      </div>
    </form>
  );
}

function ContactLogPanel({ disciple, preview }: { disciple: DiscipleSummary; preview: boolean }) {
  const [kind, setKind] = useState<DiscipleshipManualContactKind>("call");
  const [note, setNote] = useState("");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <div className="grid gap-3 rounded-sm bg-zinc-50 p-3">
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(
            () => logContactAction({ membershipId: disciple.membershipId, kind, note }),
            () => setNote(""),
          );
        }}
      >
        <p className="text-xs font-medium text-zinc-900">
          Record how you followed up with {disciple.firstName}
        </p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Contact type">
          {DISCIPLESHIP_MANUAL_CONTACT_KINDS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={kind === option}
              onClick={() => setKind(option)}
              className={`rounded-full border px-2.5 py-1 text-[0.7rem] font-medium ${
                kind === option
                  ? "border-[var(--color-brand-blue)] bg-white text-[var(--color-brand-blue)]"
                  : "border-zinc-200 bg-white text-zinc-600"
              }`}
            >
              {CONTACT_LABELS[option]}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={note}
          maxLength={DISCIPLESHIP_CONTACT_NOTE_MAX_LENGTH}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Short private note (optional)"
          aria-label="Private note"
          className={inputClass}
        />
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.7rem] text-zinc-400">Only you can see this log.</p>
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            Save
          </button>
        </div>
      </form>
      {disciple.recentContacts.length > 0 ? (
        <ul className="grid gap-1.5 border-t border-zinc-200 pt-2">
          {disciple.recentContacts.map((entry) => (
            <li key={entry.id} className="text-[0.7rem] leading-[1.5] text-zinc-600">
              <span className="font-semibold text-zinc-800">{CONTACT_LABELS[entry.kind]}</span>
              <span className="text-zinc-400"> · {formatDiscipleshipDate(entry.createdAt)}</span>
              {entry.note ? <span className="block text-zinc-600">{entry.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
