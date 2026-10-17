"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, ContactRoundIcon, PlusIcon, SearchIcon, SparklesIcon } from "lucide-react";

import type { GroupJoinDecision } from "@/lib/community/groups";
import type { GroupSummary } from "@/lib/db/queries/community-groups";

import { GroupCard, leadColourways } from "../community-home-v3";
import homeStyles from "../community-home-v3.module.css";
import peopleStyles from "../discipleship/discipleship-group.module.css";
import { CreateGroupDialog } from "./create-group-dialog";
import { GroupJoinButton } from "./group-join-button";

export type DirectoryDiscipleship = {
  joined: { groupId: number; groupName: string } | null;
  leading: Array<{ groupId: number; groupName: string; discipleCount: number }>;
};

/** Counts for the "People to bring in" rows; a null row is hidden. */
export type PeopleToBringIn = {
  contacts: number | null;
  enrollees: { total: number; free: number } | null;
};

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

/** A Discover row: art thumbnail, name, privacy and size, and Join or Request. */
function DiscoverRow({ group }: { group: GroupSummary }) {
  const art = group.privacy === "private" ? "private" : "public";
  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <Link href={`/dashboard/community/groups/${group.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          aria-hidden
          className="size-11 shrink-0 rounded-[10px] bg-cover bg-right-bottom"
          style={{
            backgroundColor: art === "private" ? "#f6d9de" : "#f9caa7",
            backgroundImage: `url("/assets/dashboard/community-groups/${art}-compact-320.webp")`,
          }}
        />
        <span className="grid min-w-0">
          <span className="truncate text-[13.5px] font-semibold leading-[18px] text-[var(--color-community-ink)]">{group.name}</span>
          <span className="truncate text-[12px] leading-[16px] text-[var(--color-community-muted)]">
            {group.privacy === "public" ? "Public" : "Private"} · {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
            {group.description ? ` · ${group.description}` : ""}
          </span>
        </span>
      </Link>
      <GroupJoinButton groupId={group.id} join={joinDecisionFor(group)} />
    </li>
  );
}

/** Every group the viewer is in as cards, then the open groups they could join. */
export function GroupsDirectory({
  groups,
  locationGroups,
  discipleship,
  canCreate,
  startCreating = false,
  people = null,
}: {
  groups: GroupSummary[];
  locationGroups: LocationGroupLink[];
  discipleship: DirectoryDiscipleship | null;
  canCreate: boolean;
  /** `?create=1` from the Community home's "New group" button. */
  startCreating?: boolean;
  /** People on their way into the viewer's groups; null rows are hidden. */
  people?: PeopleToBringIn | null;
}) {
  const [creating, setCreating] = useState(startCreating);
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
  const hasMine = locationGroups.length > 0 || Boolean(discipleship?.joined) || (discipleship?.leading.length ?? 0) > 0 || mine.length > 0;

  return (
    <div className={homeStyles.home} style={{ paddingTop: 0, maxWidth: "none", paddingInline: 0 }}>
      <h1 className="m-0">Groups</h1>

      <section className={homeStyles.block} aria-labelledby="groups-yours">
        <div className={homeStyles.blockHeading}>
          <h2 id="groups-yours">Your groups</h2>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex h-7 items-center gap-1 rounded-[10px] bg-[var(--color-community-blue)] px-2.5 text-[12.5px] font-semibold text-white"
            >
              <PlusIcon className="size-3.5" strokeWidth={2.4} />
              New group
            </button>
          ) : null}
        </div>
        {hasMine ? (
          <div className={homeStyles.groupGrid}>
            {locationGroups.map((group) => (
              <GroupCard key={`unit-${group.id}`} href={`/dashboard/community/unit/${group.id}`} art="location" title={group.name}
                tag={group.relation === "manager" ? "You look after" : undefined}
                meta={group.relation === "manager" ? "Location group" : "Your location group"} />
            ))}
            {discipleship?.leading.map((group, index) => (
              <GroupCard key={`led-${group.groupId}`} href={`/dashboard/community/discipleship/${group.groupId}`} prefetch={false} art="leading"
                colourway={leadColourways[index % leadColourways.length]} title={group.groupName}
                meta={group.discipleCount ? `${group.discipleCount} ${group.discipleCount === 1 ? "disciple" : "disciples"}` : "Invite your first disciple"} />
            ))}
            {discipleship?.joined ? (
              <GroupCard href={`/dashboard/community/discipleship/${discipleship.joined.groupId}`} prefetch={false} art="discipleship" title={discipleship.joined.groupName} meta="You're a member" />
            ) : null}
            {mine.map((group) => (
              <GroupCard key={group.id} href={`/dashboard/community/groups/${group.id}`} art={group.privacy === "private" ? "private" : "public"} title={group.name}
                meta={group.viewerStatus === "pending" ? "Request pending" : group.viewerRole === "owner" ? "You own this group" : group.viewerRole === "moderator" ? "You moderate" : `${group.memberCount} member${group.memberCount === 1 ? "" : "s"}`} />
            ))}
          </div>
        ) : (
          <p className="m-0 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-4 py-3.5 text-[13px] text-[var(--color-community-muted)]">You’re not in a group yet.</p>
        )}
      </section>

      {people && (people.contacts !== null || people.enrollees !== null) ? <section className={homeStyles.block} aria-labelledby="groups-people">
        <div className={homeStyles.blockHeading}><h2 id="groups-people">People to bring in</h2></div>
        <div className={peopleStyles.panel}>
          <ul className={peopleStyles.list}>
            {people.contacts !== null ? <li><Link href="/dashboard/community/contacts" className={peopleStyles.row}>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#e4ebfd] text-[#2331ae]"><ContactRoundIcon className="size-4" strokeWidth={2} /></span>
              <span className={peopleStyles.rowCopy}><span className={peopleStyles.rowTitle} style={{ fontWeight: 500 }}>Saved contacts</span><span className={peopleStyles.rowMeta}>{people.contacts ? `${people.contacts} ${people.contacts === 1 ? "person" : "people"} you’ve met · invite them to a group` : "People you meet in ministry"}</span></span>
              <ChevronRightIcon className={`${peopleStyles.chev} size-4`} strokeWidth={2} />
            </Link></li> : null}
            {people.enrollees !== null ? <li><Link href="/dashboard/sogp/enrollees" className={peopleStyles.row}>
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#fde3cf] text-[#7a3a10]"><SparklesIcon className="size-4" strokeWidth={2} /></span>
              <span className={peopleStyles.rowCopy}><span className={peopleStyles.rowTitle} style={{ fontWeight: 500 }}>My enrollees</span><span className={peopleStyles.rowMeta}>{people.enrollees.total ? `Signed up with your link · ${people.enrollees.free} not in a group` : "People who sign up with your link"}</span></span>
              {people.enrollees.free ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--color-community-blue)] px-1.5 text-[11px] font-semibold text-white">{people.enrollees.free}</span> : null}
              <ChevronRightIcon className={`${peopleStyles.chev} size-4`} strokeWidth={2} />
            </Link></li> : null}
          </ul>
        </div>
        <p className={`${peopleStyles.note} mt-2`}>Contacts are people you’ve met; enrollees signed up with your link. Invite either into a group you lead.</p>
      </section> : null}

      <section className={homeStyles.block} aria-labelledby="groups-discover">
        <div className={homeStyles.blockHeading}><h2 id="groups-discover">Discover</h2></div>
        {hasOthers ? (
          <label className="relative mb-2.5 block">
            <span className="sr-only">Search groups</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-community-muted)]" strokeWidth={2} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search groups"
              className="h-[38px] w-full rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white pl-9 pr-3 text-[16px] outline-none focus:border-[var(--color-community-edge-strong)]"
            />
          </label>
        ) : null}
        <div className="overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white">
          {discover.length > 0 ? (
            <ul className="m-0 list-none divide-y divide-[var(--color-line,#e7e9ec)] p-0">
              {discover.map((group) => <DiscoverRow key={group.id} group={group} />)}
            </ul>
          ) : (
            <p className="m-0 px-4 py-3.5 text-[13px] text-[var(--color-community-muted)]">
              {hasOthers ? "No groups match that search." : "No other groups to join yet."}
            </p>
          )}
        </div>
      </section>

      <CreateGroupDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
