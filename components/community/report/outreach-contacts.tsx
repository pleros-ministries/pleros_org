"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { CommunityActionResult } from "@/lib/community/errors";
import { FOLLOW_UP_NOTE_MAX, phoneHref } from "@/lib/community/outreach-contacts";
import { dateKeyLabel } from "@/lib/community/time";
import type { OutreachContact } from "@/lib/db/queries/outreach-contacts";
import {
  removeOutreachContactAction,
  setOutreachFollowUpAction,
} from "@/app/(site)/dashboard/community/_actions/outreach-actions";

const followedUpFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
});

function useContactAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<CommunityActionResult>,
    steps: { optimistic?: () => void; onDone?: () => void } = {},
  ) {
    setError(null);
    startTransition(async () => {
      steps.optimistic?.();
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        steps.onDone?.();
        router.refresh();
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  return { run, pending, error };
}

function ContactRow({
  contact,
  memberName,
  canDelete,
  showDate,
  onFollowUpChange,
}: {
  contact: OutreachContact;
  memberName?: string;
  canDelete: boolean;
  showDate: boolean;
  onFollowUpChange?: (contactId: number) => void;
}) {
  const { run, pending, error } = useContactAction();
  const [noting, setNoting] = useState(false);
  const [note, setNote] = useState("");
  const tel = phoneHref(contact.phone);
  // The tick shows at once; the action's revalidation then brings the saved value.
  const [done, setDone] = useOptimistic(contact.followedUpAt !== null);

  function toggle(next: boolean) {
    setNoting(false);
    onFollowUpChange?.(contact.id);
    run(() => setOutreachFollowUpAction({ contactId: contact.id, done: next }), {
      optimistic: () => setDone(next),
    });
  }

  return (
    <li className="grid gap-1.5 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="grid min-w-0 gap-0.5">
          <p className="font-medium text-zinc-900">
            {contact.name}
            {tel ? (
              <>
                {" · "}
                <a
                  href={tel}
                  className="font-normal text-(--color-brand-blue) underline underline-offset-2"
                >
                  {contact.phone}
                </a>
              </>
            ) : null}
          </p>
          <p className="text-xs text-zinc-500">
            {[
              showDate ? `Met ${dateKeyLabel(contact.metDate)}` : null,
              memberName ? `by ${memberName}` : null,
            ]
              .filter(Boolean)
              .join(" ")}
            {contact.note ? `${showDate || memberName ? " · " : ""}${contact.note}` : ""}
          </p>
        </div>
        <label
          className={`flex min-h-9 shrink-0 cursor-pointer items-center gap-2 text-xs font-medium ${
            done ? "text-emerald-700" : "text-zinc-700"
          }`}
        >
          <input
            type="checkbox"
            checked={done}
            disabled={pending}
            onChange={(event) => toggle(event.target.checked)}
            aria-label={`Followed up: ${contact.name}`}
            className="size-4 accent-[var(--color-brand-blue)]"
          />
          Followed up
        </label>
      </div>

      {done && contact.followedUpAt ? (
        <p className="text-xs text-zinc-500">
          {followedUpFmt.format(new Date(contact.followedUpAt))}
          {contact.followedUpByName ? ` by ${contact.followedUpByName}` : ""}
          {contact.followUpNote ? ` · ${contact.followUpNote}` : ""}
        </p>
      ) : null}

      {noting ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={FOLLOW_UP_NOTE_MAX}
            placeholder="How did it go? (optional)"
            aria-label={`Follow-up note for ${contact.name}`}
            className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 px-2.5 text-base outline-none focus:border-zinc-300 sm:text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  setOutreachFollowUpAction({
                    contactId: contact.id,
                    done: true,
                    note,
                  }),
                { onDone: () => setNoting(false) },
              )
            }
            className="inline-flex h-9 items-center rounded-full bg-(--color-brand-blue) px-3.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save note"}
          </button>
          <button
            type="button"
            onClick={() => setNoting(false)}
            className="text-xs text-zinc-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : done || canDelete ? (
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {done ? (
            <button
              type="button"
              onClick={() => {
                setNote(contact.followUpNote ?? "");
                setNoting(true);
              }}
              className="font-medium text-(--color-brand-blue) underline underline-offset-2"
            >
              {contact.followUpNote ? "Edit note" : "Add a note"}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`Remove ${contact.name} from your list?`)) {
                  run(() => removeOutreachContactAction(contact.id));
                }
              }}
              className="text-red-700 underline underline-offset-2 disabled:opacity-60"
            >
              Remove
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </li>
  );
}

/**
 * People met in outreach, each with a "Followed up" checkbox. Whoever can see
 * the list can tick someone off and add a note; only the member who added a
 * person can remove them.
 */
export function OutreachContactList({
  contacts,
  canDelete = false,
  showDate = true,
  emptyText,
  onFollowUpChange,
}: {
  contacts: Array<OutreachContact & { memberName?: string }>;
  canDelete?: boolean;
  showDate?: boolean;
  emptyText: string;
  /** Called with the person's id as soon as their checkbox is ticked or cleared. */
  onFollowUpChange?: (contactId: number) => void;
}) {
  if (contacts.length === 0) {
    return <p className="px-4 py-4 text-sm text-zinc-500">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-zinc-100">
      {contacts.map((contact) => (
        <ContactRow
          key={contact.id}
          contact={contact}
          memberName={contact.memberName}
          canDelete={canDelete}
          showDate={showDate}
          onFollowUpChange={onFollowUpChange}
        />
      ))}
    </ul>
  );
}
