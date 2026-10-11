"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";
import { SALVATION_STATUS_LABELS, DISCIPLESHIP_STATUS_LABELS } from "@/lib/community/outreach-contacts";
import { contactsFor, openLedGroups } from "@/lib/preview/pleros/scope";
import { acceptInvite, declineInvite, inviteContact, logFollowUp } from "@/lib/preview/pleros/store";
import { cn } from "@/lib/utils";
import { useDemo } from "./demo-context";
import { Badge, EmptyState, Initials, buttonSmall, focusRing, panel, shortDate } from "./ui";

export function ContactsView() {
  const { state, viewer, href, run } = useDemo();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const groups = openLedGroups(state, viewer.id).filter((group) => group.status === "active");
  const [chosenGroup, setChosenGroup] = useState(() => Number(params.get("group")) || groups[0]?.id || 0);
  const groupId = groups.some((group) => group.id === chosenGroup) ? chosenGroup : groups[0]?.id;
  const contacts = contactsFor(state, viewer.id)
    .filter((contact) => `${contact.name} ${contact.phone ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => b.metDate.localeCompare(a.metDate));

  return (
    <section aria-label="Contacts" className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="relative order-1 min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search contacts</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-3 size-4 text-(--color-text-muted)" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className={cn("h-10 w-full rounded-full border border-(--color-line-strong) bg-white pl-9 pr-3 text-base sm:text-sm", focusRing)}
          />
        </label>
        {groups.length > 0 ? (
          <label className="order-2 grid basis-full gap-1 text-[12px] text-(--color-text-muted) sm:basis-auto">
            Invite to group
            <select
              value={groupId}
              onChange={(event) => setChosenGroup(Number(event.target.value))}
              className={cn("h-10 w-full rounded-full border border-(--color-line-strong) bg-white px-3 text-sm text-(--color-text-strong) sm:max-w-[240px]", focusRing)}
            >
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
        ) : null}
        <Link href={href("reports/ministry", { kind: "outreach" })} className={cn(buttonSmall, "order-1 shrink-0 sm:order-3")}>
          <PlusIcon className="size-3.5" aria-hidden /> Log evangelism
        </Link>
      </div>

      {contacts.length === 0 ? (
        <EmptyState title={search ? "No matching contacts" : "No contacts yet"} />
      ) : (
        <ul className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
          {contacts.map((contact) => {
            const invitedGroup = state.groups.find((group) => group.id === contact.invite?.groupId);
            return (
              <li key={contact.id} className="grid gap-3 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Initials name={contact.name} size="sm" />
                    <div className="grid gap-0.5">
                      <p className="text-[14px] font-medium text-(--color-text-strong)">{contact.name}</p>
                      <p className="text-[12px] text-(--color-text-muted)">Met {shortDate(contact.metDate)} · {SALVATION_STATUS_LABELS[contact.salvationStatus]}</p>
                      {contact.phone ? <p className="text-[12px] text-(--color-text-muted)">{contact.phone}</p> : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>{DISCIPLESHIP_STATUS_LABELS[contact.discipleshipStatus]}</Badge>
                    {contact.invite ? (
                      <Badge tone={contact.invite.status === "accepted" ? "done" : "blue"}>
                        {contact.invite.status === "accepted" ? "Joined" : contact.invite.status === "declined" ? "Declined" : "Invited"}
                        {invitedGroup ? ` · ${invitedGroup.name}` : ""}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                {contact.note ? <p className="text-[13px] text-(--color-text-muted)">{contact.note}</p> : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={buttonSmall} onClick={() => run((current) => logFollowUp(current, viewer.id, contact.id))}>Log a follow-up</button>
                  {!contact.personId && contact.invite?.status !== "invited" && groupId ? (
                    <button
                      type="button"
                      className={buttonSmall}
                      disabled={!contact.followedUpAt}
                      onClick={() => run((current) => inviteContact(current, viewer.id, contact.id, groupId))}
                    >Invite</button>
                  ) : null}
                  {contact.invite?.status === "invited" ? (
                    <>
                      <span className="text-[12px] text-(--color-text-muted)">As {contact.name}</span>
                      <button type="button" className={buttonSmall} onClick={() => run((current) => acceptInvite(current, contact.id))}>Enrol and accept</button>
                      <button type="button" className={buttonSmall} onClick={() => run((current) => declineInvite(current, contact.id))}>Decline</button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
