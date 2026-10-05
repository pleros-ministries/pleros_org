"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GlobeIcon,
  HeartHandshakeIcon,
  LockIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import type { GroupJoinDecision } from "@/lib/community/groups";
import type { GroupSummary } from "@/lib/db/queries/community-groups";

import { CreateGroupDialog } from "./create-group-dialog";
import { GroupJoinButton } from "./group-join-button";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

export type LocationGroupLink = {
  id: number;
  name: string;
  /** "member" for the viewer's own group; "manager" for one they look after. */
  relation: "member" | "manager";
};

function joinDecisionFor(group: GroupSummary): GroupJoinDecision {
  if (group.viewerStatus === "active") return { action: "none", reason: "member" };
  if (group.viewerStatus === "pending") {
    return { action: "none", reason: "pending" };
  }
  if (group.viewerStatus === "banned") return { action: "none", reason: "banned" };
  return group.privacy === "public" ? { action: "join" } : { action: "request" };
}

function PrivacyBadge({ privacy }: { privacy: GroupSummary["privacy"] }) {
  const Icon = privacy === "public" ? GlobeIcon : LockIcon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.7rem] font-medium text-zinc-600">
      <Icon className="size-3" strokeWidth={2} />
      {privacy === "public" ? "Public" : "Private"}
    </span>
  );
}

function GroupRow({ group }: { group: GroupSummary }) {
  const roleLabel =
    group.viewerStatus !== "active"
      ? null
      : group.viewerRole === "owner"
        ? "Owner"
        : group.viewerRole === "moderator"
          ? "Moderator"
          : "Member";

  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="grid min-w-0 gap-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/dashboard/community/groups/${group.id}`}
            className="text-sm font-semibold text-zinc-900 hover:underline"
          >
            {group.name}
          </Link>
          <PrivacyBadge privacy={group.privacy} />
          {roleLabel ? (
            <span className="rounded-full bg-(--muted) px-2 py-0.5 text-[0.7rem] font-medium text-(--color-brand-blue)">
              {roleLabel}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-zinc-500">
          {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
        </p>
        {group.description ? (
          <p className="line-clamp-2 text-[13px] text-zinc-600">
            {group.description}
          </p>
        ) : null}
      </div>
      <GroupJoinButton groupId={group.id} join={joinDecisionFor(group)} />
    </li>
  );
}

/** Every group the viewer is in, plus the open groups they could join. */
export function GroupsDirectory({
  groups,
  locationGroups,
  showDiscipleship,
  canCreate,
}: {
  groups: GroupSummary[];
  locationGroups: LocationGroupLink[];
  showDiscipleship: boolean;
  canCreate: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");

  const mine = groups.filter(
    (group) => group.viewerStatus === "active" || group.viewerStatus === "pending",
  );
  const term = query.trim().toLowerCase();
  const discover = groups.filter(
    (group) =>
      group.viewerStatus == null &&
      (term === "" ||
        group.name.toLowerCase().includes(term) ||
        group.description.toLowerCase().includes(term)),
  );
  const hasOthers = groups.some((group) => group.viewerStatus == null);

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            Groups
          </h1>
          <p className="max-w-md text-sm text-zinc-500">
            Join a group around something you care about, or start your own.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-(--color-brand-blue) px-3.5 text-[13px] font-semibold text-white"
          >
            <PlusIcon className="size-4" strokeWidth={2} />
            Create group
          </button>
        ) : null}
      </header>

      <section className={`${card} overflow-hidden`}>
        <h2 className="ppc-heading border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
          Your groups
        </h2>
        <ul className="divide-y divide-zinc-100">
          {locationGroups.map((group) => (
            <li key={`unit-${group.id}`} className="px-4 py-3">
              <Link
                href={`/dashboard/community/unit/${group.id}`}
                className="flex items-center gap-3"
              >
                <MapPinIcon
                  className="size-4 shrink-0 text-(--fulfil-accent)"
                  strokeWidth={2}
                />
                <span className="grid min-w-0">
                  <span className="truncate text-sm font-semibold text-zinc-900">
                    {group.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {group.relation === "manager"
                      ? "Location group · you look after this group"
                      : "Your location group"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          {showDiscipleship ? (
            <li className="px-4 py-3">
              <Link
                href="/dashboard/community/discipleship"
                className="flex items-center gap-3"
              >
                <HeartHandshakeIcon
                  className="size-4 shrink-0 text-(--purpose-accent)"
                  strokeWidth={2}
                />
                <span className="grid min-w-0">
                  <span className="text-sm font-semibold text-zinc-900">
                    Discipleship
                  </span>
                  <span className="text-xs text-zinc-500">
                    Your discipler and the people you disciple
                  </span>
                </span>
              </Link>
            </li>
          ) : null}
          {mine.map((group) => (
            <GroupRow key={group.id} group={group} />
          ))}
        </ul>
        {mine.length === 0 ? (
          <p className="border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500">
            You have not joined any other groups yet.
          </p>
        ) : null}
      </section>

      <section className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Discover groups
          </h2>
          {hasOthers ? (
            <label className="relative block w-full sm:w-56">
              <span className="sr-only">Search groups</span>
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                strokeWidth={2}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search groups"
                className="h-9 w-full rounded-full border border-zinc-200 pl-9 pr-3 text-base outline-none focus:border-zinc-300 sm:text-sm"
              />
            </label>
          ) : null}
        </div>
        {discover.length > 0 ? (
          <ul className="divide-y divide-zinc-100">
            {discover.map((group) => (
              <GroupRow key={group.id} group={group} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-4 text-sm text-zinc-500">
            {hasOthers
              ? "No groups match that search."
              : "There are no other groups yet. Be the first to start one."}
          </p>
        )}
      </section>

      <CreateGroupDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
