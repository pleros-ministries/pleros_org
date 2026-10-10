"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CopyIcon, HeartHandshakeIcon, LinkIcon, PauseIcon, PlusIcon, ShieldIcon, UserCheckIcon } from "lucide-react";

import { inputClass } from "@/components/community/report/styles";
import { sumMinistryNumbers, totalReached } from "@/lib/community/ministry-report";
import { cn } from "@/lib/utils";
import { activitiesFor, trackerDays } from "@/lib/preview/pleros/daily-report";
import { DEMO_GROUP_MAX } from "@/lib/preview/pleros/fixtures";
import {
  contactsFor,
  findPerson,
  groupMemberIds,
  joinedGroup,
  ledGroups,
  openLedGroups,
  scopeIds,
} from "@/lib/preview/pleros/scope";
import { DISCIPLE_STATUS_LABELS, recentParticipation, sogpProgress } from "@/lib/preview/pleros/sogp";
import { closeGroup, createGroup, createGroupBlock, renameGroup } from "@/lib/preview/pleros/store";
import type { DemoGroup } from "@/lib/preview/pleros/types";

import { useDemo } from "./demo-context";
import { ContactsView } from "./contacts-view";
import { Badge, CountBadge, EmptyState, Initials, PageHeader, Segmented, buttonPrimary, buttonQuiet, buttonSecondary, buttonSmall, focusRing, panel, shortDate } from "./ui";

const monthYear = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

function joinedLabel(dateKey: string) {
  return `Joined ${monthYear.format(new Date(`${dateKey}T00:00:00Z`))}`;
}

export function DisciplesView() {
  const { state, viewer, href } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = openLedGroups(state, viewer.id);
  const joined = joinedGroup(state, viewer.id);
  const requestedTab = searchParams.get("tab");
  const tab = requestedTab === "in" || requestedTab === "contacts" ? requestedTab : "lead";

  return (
    <div className="grid gap-6">
      <PageHeader
        title="My disciples"
        actions={
          <Segmented
            label="Discipleship view"
            value={tab}
            onChange={(next) =>
              router.replace(href("disciples", { tab: next === "lead" ? null : next, group: searchParams.get("group") }), {
                scroll: false,
              })
            }
            options={[
              { key: "lead", label: "Groups", count: open.length },
              { key: "in", label: "My group", count: joined ? 1 : 0 },
                { key: "contacts", label: "Contacts", count: contactsFor(state, viewer.id).length },
            ]}
          />
        }
      />
      {tab === "contacts" ? <ContactsView key={viewer.id} /> : tab === "lead" ? <LedGroups /> : <JoinedGroup />}
    </div>
  );
}

// ─── Groups you lead ──────────────────────────────────────────────────────

function LedGroups() {
  const { state, viewer, href, run } = useDemo();
  const router = useRouter();
  const searchParams = useSearchParams();
  const all = ledGroups(state, viewer.id);
  const open = all.filter((group) => group.status !== "closed");
  const closed = all.filter((group) => group.status === "closed");
  const requested = Number(searchParams.get("group"));
  const selected = open.find((group) => group.id === requested) ?? open[0];
  const block = createGroupBlock(state, viewer.id);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const select = (id: number) =>
    router.replace(href("disciples", { group: String(id), contact: searchParams.get("contact") }), { scroll: false });

  function create(groupName: string) {
    let groupId: number | undefined;
    run((current) => {
      const outcome = createGroup(current, viewer.id, groupName);
      groupId = outcome.groupId;
      return outcome;
    });
    if (groupId) {
      setCreating(false);
      setName("");
      select(groupId);
    }
  }

  if (open.length === 0) {
    return (
      <>
        <EmptyState
          icon={<HeartHandshakeIcon className="size-5" aria-hidden />}
          title="You don't lead a group yet"
          action={
            <button
              type="button"
              className={buttonPrimary}
              onClick={() => create(`${viewer.firstName}'s discipleship group`)}
            >
              Start your first group
            </button>
          }
        ></EmptyState>
        <ClosedGroups groups={closed} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Groups you lead">
        {open.map((group) => {
          const active = group.id === selected?.id;
          const count = groupMemberIds(state, group.id).length;
          return (
            <button
              key={group.id}
              type="button"
              aria-pressed={active}
              onClick={() => select(group.id)}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-[13.5px] font-medium transition-colors",
                focusRing,
                active
                  ? "border-(--color-brand-blue) bg-(--color-brand-blue) text-white"
                  : "border-(--color-line-strong) bg-white text-(--color-text-strong) hover:border-(--color-brand-blue)",
              )}
            >
              {group.status === "archived" ? <PauseIcon className="size-3.5" aria-hidden /> : null}
              {group.name}
              <span
                className={cn(
                  "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] tabular-nums",
                  active ? "bg-white/20" : "bg-(--color-surface-muted) text-(--color-text-muted)",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        {creating ? (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              create(name);
            }}
          >
            <label className="sr-only" htmlFor="new-group-name">
              New group name
            </label>
            <input
              id="new-group-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Group name"
              maxLength={60}
              className={cn(inputClass, "h-10 w-56 rounded-full")}
            />
            <button type="submit" className={buttonSmall}>
              Create
            </button>
            <button type="button" className={buttonQuiet} onClick={() => setCreating(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            disabled={Boolean(block)}
            title={block ?? undefined}
            className={cn(buttonQuiet, "min-h-10")}
          >
            <PlusIcon className="size-4" aria-hidden />
            New group
          </button>
        )}
      </div>
      {block ? <p className="-mt-3 text-[12.5px] text-(--color-text-muted)">{block}</p> : null}

      {selected ? <GroupPanel key={selected.id} group={selected} /> : null}

      <ClosedGroups groups={closed} />
    </>
  );
}

function GroupPanel({ group }: { group: DemoGroup }) {
  const { state, viewer, today, run, notify } = useDemo();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const members = groupMemberIds(state, group.id)
    .map((id) => findPerson(state, id))
    .filter((person) => person !== undefined);
  const paused = group.status === "archived";
  const openCount = openLedGroups(state, viewer.id).length;
  const oversight = new Set(scopeIds(state, viewer.id));
  const inviteUrl = `pleros.org/sogp/discipleship/${group.inviteCode}`;
  const closeBlock = paused
    ? "A paused group can't be closed by its leader."
    : openCount <= 1
      ? "You need at least one group, so this one can't be closed."
      : null;
  const week = trackerDays(today);

  return (
    <section aria-labelledby="group-name" className={cn(panel, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--color-line) px-4 py-4 sm:px-5">
        <div className="grid gap-1">
          {renaming ? (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const outcome = run((current) => renameGroup(current, viewer.id, group.id, name));
                if (outcome.ok) setRenaming(false);
              }}
            >
              <label htmlFor="rename-group" className="sr-only">
                Group name
              </label>
              <input
                id="rename-group"
                autoFocus
                value={name}
                maxLength={60}
                onChange={(event) => setName(event.target.value)}
                className={cn(inputClass, "h-10 w-64")}
              />
              <button type="submit" className={buttonSmall}>
                Save
              </button>
              <button type="button" className={buttonQuiet} onClick={() => setRenaming(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <h2 id="group-name" className="text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong)">
              {group.name}
            </h2>
          )}
          <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-(--color-text-muted)">
            <span className="tabular-nums">
              {members.length} of {DEMO_GROUP_MAX} disciples
            </span>
            {paused ? <Badge tone="confirm">Paused by the Pleros team</Badge> : <Badge tone="blue">Active</Badge>}
            <span>Started {shortDate(group.createdOn)}</span>
          </p>
        </div>
        {!renaming ? (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" className={buttonSmall} disabled={paused} onClick={() => setRenaming(true)}>
              Rename
            </button>
            <button
              type="button"
              className={buttonSmall}
              disabled={Boolean(closeBlock)}
              title={closeBlock ?? undefined}
              onClick={() => {
                if (
                  window.confirm(
                    `Close ${group.name}? Its link stops working and its disciples are released. Nothing is deleted, and this can't be undone.`,
                  )
                ) {
                  run((current) => closeGroup(current, viewer.id, group.id));
                }
              }}
            >
              Close group
            </button>
          </div>
        ) : null}
      </div>

      {paused ? null : (
        <div className="flex flex-wrap items-center gap-3 border-b border-(--color-line) px-4 py-3 sm:px-5">
          <LinkIcon className="size-4 text-(--color-brand-blue)" aria-hidden />
          <div className="grid min-w-0 flex-1">
            <p className="text-[12px] text-(--color-text-muted)">Invite link</p>
            <p className="truncate text-[13px] text-(--color-text-strong)">{inviteUrl}</p>
          </div>
          <button
            type="button"
            className={buttonSmall}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(`https://${inviteUrl}`);
                notify("Invite link copied.");
              } catch {
                notify("Couldn't copy here. The link is shown above.", "error");
              }
            }}
          >
            <CopyIcon className="size-3.5" aria-hidden />
            Copy
          </button>
          
        </div>
      )}

      {members.length === 0 ? (
        <div className="px-4 py-5 sm:px-5">
          <EmptyState icon={<UserCheckIcon className="size-5" aria-hidden />} title={`No one has joined ${group.name} yet`}></EmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-(--color-line) text-[12px] text-(--color-text-muted)">
                <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Disciple</th>
                <th scope="col" className="px-3 py-2.5 font-medium">This week</th>
                <th scope="col" className="px-3 py-2.5 font-medium">SOGP</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Prayer Watch</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-5">Ministry, 7 days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-line)">
              {members.map((person) => {
                const recent = recentParticipation(state, person.id);
                const progress = person.inCohort ? sogpProgress(state, person.id) : null;
                const ministry = sumMinistryNumbers(
                  week.flatMap((key) => activitiesFor(state, person.id, key)),
                );
                const membership = state.memberships.find(
                  (row) => row.groupId === group.id && row.personId === person.id && row.status === "active",
                );
                return (
                  <tr key={person.id}>
                    <td className="px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-3">
                        <Initials name={person.name} size="sm" />
                        <div className="grid">
                          <span className="font-medium text-(--color-text-strong)">{person.firstName}</span>
                          <span className="text-[12px] text-(--color-text-muted)">
                            {membership ? joinedLabel(membership.joinedOn) : null}
                          </span>
                        </div>
                        {oversight.has(person.id) ? <Badge tone="neutral">Church oversight</Badge> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        tone={recent.status === "on_track" ? "blue" : recent.status === "declining" ? "confirm" : "neutral"}
                        className={recent.status === "at_risk" ? "border-red-200 bg-red-50 text-red-800" : undefined}
                      >
                        {DISCIPLE_STATUS_LABELS[recent.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 tabular-nums text-(--color-text)">
                      {progress ? `${progress.teachings} of ${progress.teachingsTotal} teachings` : "Not in cohort"}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-(--color-text)">{recent.prayerDays} of 7 days</td>
                    <td className="px-4 py-3 text-right tabular-nums text-(--color-text) sm:px-5">
                      {ministry.followUps + totalReached(ministry) > 0
                        ? `${totalReached(ministry)} reached · ${ministry.followUps} follow-ups`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      
    </section>
  );
}

function ClosedGroups({ groups }: { groups: DemoGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <details className={cn(panel, "group px-4 py-3 sm:px-5")}>
      <summary className={cn("flex cursor-pointer list-none items-center gap-2 text-[13.5px] font-medium text-(--color-text-strong)", focusRing)}>
        Closed groups <CountBadge count={groups.length} />
      </summary>
      <ul className="mt-3 grid gap-2">
        {groups.map((group) => (
          <li key={group.id} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-(--color-text)">{group.name}</span>
            <Badge tone="neutral">Closed by you · link off</Badge>
          </li>
        ))}
      </ul>
    </details>
  );
}

// ─── The group you're in ──────────────────────────────────────────────────

function JoinedGroup() {
  const { state, viewer } = useDemo();
  const group = joinedGroup(state, viewer.id);
  if (!group) {
    return (
      <EmptyState icon={<ShieldIcon className="size-5" aria-hidden />} title="You're not in a discipleship group"></EmptyState>
    );
  }
  const leader = findPerson(state, group.leaderId)!;
  const membership = state.memberships.find(
    (row) => row.personId === viewer.id && row.groupId === group.id && row.status === "active",
  );
  const count = groupMemberIds(state, group.id).length;
  return (
    <section className={cn(panel, "grid gap-4 px-4 py-5 sm:px-6")}>
      <div className="flex items-center gap-3">
        <Initials name={leader.name} size="lg" tone="blue" />
        <div className="grid">
          <h2 className="text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong)">{group.name}</h2>
          <p className="text-[13px] text-(--color-text-muted)">
            Led by {leader.firstName} · {count} {count === 1 ? "member" : "members"}
            {membership ? ` · ${joinedLabel(membership.joinedOn).replace("Joined", "joined")}` : ""}
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonSecondary} disabled title="Leaving is not part of this demo">
          Leave group
        </button>
      </div>
    </section>
  );
}
