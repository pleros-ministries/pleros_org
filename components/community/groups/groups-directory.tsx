"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";

import type { GroupSummary } from "@/lib/db/queries/community-groups";

import { GroupCard, leadColourways } from "../community-home-v3";
import homeStyles from "../community-home-v3.module.css";
import { PeopleToBringInPanel, type PeopleToBringIn } from "../people/people-to-bring-in";

export type DirectoryDiscipleship = {
  joined: { groupId: number; groupName: string } | null;
  leading: Array<{ groupId: number; groupName: string; discipleCount: number }>;
};

/** Counts for the "People to bring in" rows; a null row is hidden. */
export type { PeopleToBringIn } from "../people/people-to-bring-in";

export type LocationGroupLink = {
  id: number;
  name: string;
  /** "member" for the viewer's own group; "manager" for one they look after. */
  relation: "member" | "manager";
};

/**
 * Every group the viewer is in or leads, as cards. There is no browsing or
 * open joining: a group is entered only by invitation, and its leader then
 * oversees you (user decision, 19 October).
 */
export function GroupsDirectory({
  groups,
  locationGroups,
  discipleship,
  people = null,
}: {
  groups: GroupSummary[];
  locationGroups: LocationGroupLink[];
  discipleship: DirectoryDiscipleship | null;
  /** People on their way into the viewer's groups; null rows are hidden. */
  people?: PeopleToBringIn | null;
}) {
  const mine = groups.filter(group => group.viewerStatus === "active");
  // New groups are oversight groups, created from a group page's form.
  const firstLed = discipleship?.leading[0];
  const newGroupHref = firstLed ? `/dashboard/community/discipleship/${firstLed.groupId}?panel=create` : "/dashboard/sogp/discipleship";

  return (
    <div className={homeStyles.home} style={{ paddingTop: 0, maxWidth: "none", paddingInline: 0 }}>
      <h1 className="m-0">Groups</h1>

      <section className={homeStyles.block} aria-labelledby="groups-yours">
        <div className={homeStyles.blockHeading}>
          <h2 id="groups-yours">Your groups</h2>
        </div>
        <div className={homeStyles.groupGrid}>
            {locationGroups.map((group) => (
              <GroupCard key={`unit-${group.id}`} href={`/dashboard/community/unit/${group.id}`} art="location" title={group.name}
                tag={group.relation === "manager" ? "You look after" : undefined}
                meta={group.relation === "manager" ? "Location group" : "Your location group"} />
            ))}
            {discipleship?.leading.map((group, index) => (
              <GroupCard key={`led-${group.groupId}`} href={`/dashboard/community/discipleship/${group.groupId}`} prefetch={false} art="leading"
                colourway={leadColourways[index % leadColourways.length]} title={group.groupName}
                meta={group.discipleCount ? `${group.discipleCount} ${group.discipleCount === 1 ? "person" : "people"}` : "Invite someone"} />
            ))}
            {discipleship?.joined ? (
              <GroupCard href={`/dashboard/community/discipleship/${discipleship.joined.groupId}`} prefetch={false} art="discipleship" title={discipleship.joined.groupName} meta="You're a member" />
            ) : null}
            {mine.map((group) => (
              <GroupCard key={group.id} href={`/dashboard/community/groups/${group.id}`} art={group.privacy === "private" ? "private" : "public"} title={group.name}
                meta={group.viewerRole === "owner" ? "You own this group" : group.viewerRole === "moderator" ? "You moderate" : `${group.memberCount} member${group.memberCount === 1 ? "" : "s"}`} />
            ))}
            {/* Same "+ New group" card as Community Home, opening the oversight-group form. */}
            <Link href={newGroupHref} prefetch={false} className={homeStyles.newGroup}>
              <span className={homeStyles.newGroupIcon}><PlusIcon className="size-4" strokeWidth={2.2} /></span>
              New group
            </Link>
          </div>
      </section>

      {people ? <PeopleToBringInPanel people={people} id="groups-people" /> : null}

    </div>
  );
}
