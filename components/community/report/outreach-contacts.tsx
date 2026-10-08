"use client";

import { useState } from "react";

import { ExpandButton } from "@/components/ppc/expandable-table-row";
import { phoneHref } from "@/lib/community/outreach-contacts";
import { dateKeyLabel } from "@/lib/community/time";
import type { OutreachContact } from "@/lib/db/queries/outreach-contacts";
import { removeOutreachContactAction } from "@/app/(site)/dashboard/community/_actions/outreach-actions";

import {
  ContactDetail,
  EditDetailsForm,
  LogFollowUpForm,
  type ContactViewer,
} from "./contact-detail";
import { ContactStatusBadges } from "./contact-status-badges";
import { errorText, textLink } from "./styles";
import { useReportAction } from "./use-report-action";

function ContactRow({
  contact,
  memberName,
  canDelete,
  showDate,
  today,
  viewer,
  onFollowUpChange,
}: {
  contact: OutreachContact;
  memberName?: string;
  canDelete: boolean;
  showDate: boolean;
  today: string;
  viewer: ContactViewer | null;
  onFollowUpChange?: (contactId: number) => void;
}) {
  const { run, pending, error } = useReportAction();
  const [panel, setPanel] = useState<"none" | "log" | "edit">("none");
  const [expanded, setExpanded] = useState(false);
  // Bumped after a change so an open history reloads.
  const [version, setVersion] = useState(0);
  const tel = phoneHref(contact.phone);
  const detailId = `contact-${contact.id}`;

  function changed() {
    setPanel("none");
    setVersion((current) => current + 1);
    onFollowUpChange?.(contact.id);
  }

  return (
    <li className="grid gap-1.5 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
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
        <ExpandButton
          expanded={expanded}
          controls={detailId}
          label={`details for ${contact.name}`}
          onToggle={() => setExpanded((current) => !current)}
        />
      </div>

      <ContactStatusBadges contact={contact} today={today} />
      {contact.followUpPlan && !expanded ? (
        <p className="text-xs text-zinc-600">
          <span className="font-medium">Plan:</span> {contact.followUpPlan}
        </p>
      ) : null}

      {panel === "log" ? (
        <LogFollowUpForm
          contact={contact}
          today={today}
          onDone={changed}
          onCancel={() => setPanel("none")}
        />
      ) : panel === "edit" ? (
        <EditDetailsForm contact={contact} onDone={changed} onCancel={() => setPanel("none")} />
      ) : (
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <button type="button" onClick={() => setPanel("log")} className={textLink}>
            Log a follow-up
          </button>
          <button type="button" onClick={() => setPanel("edit")} className={textLink}>
            Edit details
          </button>
          {canDelete ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  window.confirm(
                    `Remove ${contact.name} from your list? Their history goes with them.`,
                  )
                ) {
                  run(() => removeOutreachContactAction(contact.id));
                }
              }}
              className="text-[13px] font-medium text-red-700 underline underline-offset-2 disabled:opacity-60"
            >
              Remove
            </button>
          ) : null}
        </div>
      )}

      {expanded ? (
        <ContactDetail
          id={detailId}
          contact={contact}
          viewer={viewer}
          version={version}
        />
      ) : null}

      {error ? (
        <p role="alert" className={errorText}>
          {error}
        </p>
      ) : null}
    </li>
  );
}

/**
 * People met in ministry, each with their statuses, a way to log the next
 * follow-up and edit their details, and their history on request. Whoever
 * can see the list can log and edit; only the member who added a person can
 * remove them.
 */
export function OutreachContactList({
  contacts,
  canDelete = false,
  showDate = true,
  today,
  viewer = null,
  emptyText,
  onFollowUpChange,
}: {
  contacts: Array<OutreachContact & { memberName?: string }>;
  canDelete?: boolean;
  showDate?: boolean;
  today: string;
  viewer?: ContactViewer | null;
  emptyText: string;
  /** Called with the person's id as soon as a follow-up is logged or their details change. */
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
          today={today}
          viewer={viewer}
          onFollowUpChange={onFollowUpChange}
        />
      ))}
    </ul>
  );
}
