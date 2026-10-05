"use client";

import { useState } from "react";
import { SearchIcon } from "lucide-react";

import {
  CONTACT_SORT_LABELS,
  CONTACT_STATUS_LABELS,
  MEMBER_CONTACT_SORTS,
  filterAndSortContacts,
  type ContactSort,
  type ContactStatusFilter,
} from "@/lib/community/outreach-contacts";
import type { OutreachContact } from "@/lib/db/queries/outreach-contacts";

import { OutreachContactList } from "./outreach-contacts";

const STATUSES: ContactStatusFilter[] = ["all", "pending", "done"];

const controlClass =
  "h-9 rounded-lg border border-zinc-200 bg-white px-2 text-base text-zinc-800 outline-none focus:border-zinc-300 sm:text-sm";

/**
 * A searchable, sortable list of people met in outreach, shared by the
 * member's own page, the pastor's leader page and the admin page. `staff`
 * lists carry the member who met each person: search matches that name too,
 * and there is a sort by member.
 */
export function OutreachContactBrowser({
  contacts,
  staff = false,
  canDelete = false,
  defaultStatus = "all",
  emptyText,
}: {
  contacts: Array<OutreachContact & { memberName?: string }>;
  staff?: boolean;
  canDelete?: boolean;
  defaultStatus?: ContactStatusFilter;
  /** Shown when there is nobody at all, before any search or filter. */
  emptyText: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContactStatusFilter>(defaultStatus);
  const [sort, setSort] = useState<ContactSort>("newest");
  // People ticked or cleared under the current filter stay listed until it
  // changes, so a tick can be undone or given a note before the row leaves.
  const [touched, setTouched] = useState<ReadonlySet<number>>(() => new Set());

  const sorts: ContactSort[] = staff
    ? [...MEMBER_CONTACT_SORTS, "member"]
    : MEMBER_CONTACT_SORTS;
  const shown = filterAndSortContacts(contacts, {
    query,
    status,
    sort,
    keep: touched,
  });
  const pending = contacts.filter((contact) => contact.followedUpAt === null).length;

  return (
    <div>
      <div className="grid gap-2 border-b border-zinc-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block min-w-0 flex-1 basis-48">
            <span className="sr-only">Search people</span>
            <SearchIcon
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={2}
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                staff ? "Search name, phone, note or member" : "Search name, phone or note"
              }
              className={`${controlClass} w-full pl-8`}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            Show
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ContactStatusFilter);
                setTouched(new Set());
              }}
              className={controlClass}
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {CONTACT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
            Sort
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ContactSort)}
              className={controlClass}
            >
              {sorts.map((value) => (
                <option key={value} value={value}>
                  {CONTACT_SORT_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-zinc-500">
          Showing {shown.length} of {contacts.length} · {pending} still to follow up
        </p>
      </div>

      <OutreachContactList
        contacts={shown}
        canDelete={canDelete}
        onFollowUpChange={(contactId) =>
          setTouched((current) => new Set(current).add(contactId))
        }
        emptyText={
          contacts.length === 0
            ? emptyText
            : pending === 0 && status === "pending" && query.trim() === ""
              ? "Everyone here has been followed up."
              : "No one matches that search or filter."
        }
      />
    </div>
  );
}
