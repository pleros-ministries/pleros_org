"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type {
  CommunityDiscipleship,
  DiscipleshipPeer,
} from "@/lib/db/queries/community-discipleship";
import type { FeedPost } from "@/lib/db/queries/community-posts";

import { Avatar } from "./avatar";
import { FeedComposer } from "./feed-composer";
import { MessageButton } from "./messages/message-button";
import { PostFeed } from "./post-feed";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

const TOOLS_HREF = "/dashboard/sogp/discipleship";

type TabKey = "discussions" | "members";

/** One discipleship group the viewer can open: the one they joined or one they lead. */
type Space = {
  kind: "joined" | "leading";
  groupId: number;
  groupName: string;
  /** Who leads it and how full it is, shown under the name. */
  summary: string;
  /** People listed on the Members tab (everyone in the group but the viewer). */
  members: DiscipleshipPeer[];
  memberCount: number;
};

/** One labelled row of the switcher, so led groups never mix with the joined one. */
function SpaceSet({
  label,
  spaces,
  activeGroupId,
  onSelect,
}: {
  label: string;
  spaces: Space[];
  activeGroupId: number | null;
  onSelect: (groupId: number) => void;
}) {
  if (spaces.length === 0) return null;
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {spaces.map((space) => {
          const selected = space.groupId === activeGroupId;
          return (
            <button
              key={space.groupId}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(space.groupId)}
              className={`h-8 max-w-full truncate rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
                selected
                  ? "border-(--color-brand-blue) bg-(--color-brand-blue) text-white"
                  : "border-(--color-line-strong) bg-white text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {space.groupName}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeerRow({
  person,
  badge,
  detail,
}: {
  person: { firstName: string; messageUserId: string | null };
  badge?: string;
  detail: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span className="flex min-w-0 items-center gap-2.5">
        <Avatar name={person.firstName} size={32} />
        <span className="grid min-w-0">
          <span className="flex items-center gap-1.5 font-medium text-zinc-900">
            <span className="truncate">{person.firstName}</span>
            {badge ? (
              <span className="rounded-full bg-(--muted) px-2 py-0.5 text-[0.7rem] font-medium text-(--color-brand-blue)">
                {badge}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-zinc-500">{detail}</span>
        </span>
      </span>
      {person.messageUserId ? (
        <MessageButton userId={person.messageUserId} />
      ) : null}
    </li>
  );
}

function PeerRows({ people }: { people: DiscipleshipPeer[] }) {
  return (
    <>
      {people.map((person, index) => (
        <PeerRow
          key={`${person.firstName}-${index}`}
          person={person}
          detail={`Joined ${person.joinedMonth}`}
        />
      ))}
    </>
  );
}

/**
 * Discipleship inside the community: a private discussion space for each
 * group the learner is part of (the one they joined and every one they lead),
 * plus its members. Only the group's discipler and current disciples can see
 * or post in it. Check-ins, prayer requests and the invite links stay in the
 * discipleship tools.
 */
export function CommunityDiscipleshipView({
  data,
  viewerName,
  initialGroupId,
  initialPosts,
  initialNextOffset,
  postingBlocked,
}: {
  data: CommunityDiscipleship;
  viewerName: string;
  /** The group whose first page the server already loaded. */
  initialGroupId: number | null;
  initialPosts: FeedPost[];
  initialNextOffset: number | null;
  postingBlocked: boolean;
}) {
  const { joined, leading } = data;

  const joinedSpace: Space | null = joined
    ? {
        kind: "joined",
        groupId: joined.groupId,
        groupName: joined.groupName,
        summary: `Led by ${joined.discipler.firstName} · you joined ${joined.joinedMonth}`,
        members: joined.fellowDisciples,
        memberCount: joined.fellowDisciples.length + 1,
      }
    : null;
  // A led group's space opens once its first disciple joins.
  const ledSpaces: Space[] = leading
    .filter((group) => !group.paused && group.disciples.length > 0)
    .map((group) => ({
      kind: "leading",
      groupId: group.groupId,
      groupName: group.groupName,
      summary: `You lead this group · ${group.disciples.length} of ${group.capacity} disciples`,
      members: group.disciples,
      memberCount: group.disciples.length,
    }));
  const spaces = joinedSpace ? [joinedSpace, ...ledSpaces] : ledSpaces;

  const pausedGroups = leading.filter((group) => group.paused);
  // Nothing to invite people to while every group the learner leads is paused.
  const showInviteHint =
    ledSpaces.length === 0 &&
    (leading.length === 0 || leading.some((group) => !group.paused));

  const [activeGroupId, setActiveGroupId] = useState<number | null>(
    spaces.find((space) => space.groupId === initialGroupId)?.groupId ??
      spaces[0]?.groupId ??
      null,
  );
  const [tab, setTab] = useState<TabKey>("discussions");
  const active = spaces.find((space) => space.groupId === activeGroupId) ?? null;
  const select = (groupId: number) => {
    setActiveGroupId(groupId);
    setTab("discussions");
  };

  // The discipler can also post announcements to a group they lead.
  const announcementReach = active?.kind === "leading" ? "all" : "none";

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "discussions", label: "Discussions" },
    { key: "members", label: "Members", count: active?.memberCount },
  ];

  return (
    <div className="grid gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            Discipleship
          </h1>
          <p className="max-w-md text-sm text-zinc-500">
            A private space for you and the people you walk with through SOGP.
            Only your group can see what is shared here.
          </p>
        </div>
        <Link
          href={TOOLS_HREF}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-(--color-line-strong) bg-white px-3.5 text-[13px] font-medium text-(--color-brand-blue)"
        >
          Discipleship tools
          <ArrowRightIcon className="size-4" strokeWidth={2} />
        </Link>
      </header>

      {spaces.length > 1 ? (
        <div
          role="group"
          aria-label="Choose a discipleship group"
          className="grid gap-3"
        >
          <SpaceSet
            label="Group you're in"
            spaces={joinedSpace ? [joinedSpace] : []}
            activeGroupId={activeGroupId}
            onSelect={select}
          />
          <SpaceSet
            label="Groups you lead"
            spaces={ledSpaces}
            activeGroupId={activeGroupId}
            onSelect={select}
          />
        </div>
      ) : null}

      {active ? (
        <>
          <section className={`${card} grid gap-3 p-4 sm:p-5`}>
            <div className="grid gap-1">
              <h2 className="ppc-heading text-base font-semibold text-zinc-900">
                {active.groupName}
              </h2>
              <p className="text-sm text-zinc-500">{active.summary}</p>
            </div>

            <div
              role="tablist"
              aria-label="Group sections"
              className="-mb-4 flex gap-5 border-t border-zinc-100 pt-1 sm:-mb-5"
            >
              {tabs.map((item) => {
                const selected = tab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setTab(item.key)}
                    className={`-mb-px inline-flex items-center gap-1.5 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                      selected
                        ? "border-(--color-brand-blue) text-(--color-brand-blue)"
                        : "border-transparent text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    {item.label}
                    {item.count != null ? (
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[0.7rem] text-zinc-600">
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          {tab === "discussions" ? (
            <>
              <FeedComposer
                key={`composer-${active.groupId}`}
                viewerName={viewerName}
                unitName={null}
                target={{ scope: "discipleship", id: active.groupId }}
                officialReach={announcementReach}
                postingBlocked={postingBlocked}
              />
              <PostFeed
                key={`feed-${active.groupId}`}
                source={{ type: "discipleship", id: active.groupId }}
                initialPosts={
                  active.groupId === initialGroupId ? initialPosts : undefined
                }
                initialNextOffset={
                  active.groupId === initialGroupId ? initialNextOffset : null
                }
                viewerName={viewerName}
                viewerUnitName={null}
                canRepost={false}
                isAdmin={false}
                emptyText="Nothing here yet. Ask a question or share what you are learning."
              />
            </>
          ) : (
            <section className={`${card} overflow-hidden`}>
              <ul className="divide-y divide-zinc-100">
                {active.kind === "joined" && joined ? (
                  <PeerRow
                    person={joined.discipler}
                    badge="Discipler"
                    detail="Leads this group"
                  />
                ) : null}
                <PeerRows people={active.members} />
              </ul>
            </section>
          )}
        </>
      ) : null}

      {!joined ? (
        <p className={`${card} p-4 text-sm text-zinc-500`}>
          You have not joined a discipleship group yet. When someone shares
          their invite link with you, their group appears here.
        </p>
      ) : null}

      {pausedGroups.map((group) => (
        <p key={group.groupId} className={`${card} p-4 text-sm text-zinc-600`}>
          {group.groupName} has been paused by the Pleros team. Contact support
          if you think this is a mistake.
        </p>
      ))}

      {showInviteHint ? (
        <p className={`${card} p-4 text-sm text-zinc-500`}>
          No one has joined a group you lead yet.{" "}
          <Link
            href={TOOLS_HREF}
            className="font-medium text-(--color-brand-blue) underline underline-offset-2"
          >
            Get an invite link
          </Link>{" "}
          and share it with the people you would like to walk with. A
          group&apos;s discussion space opens when its first person joins.
        </p>
      ) : null}
    </div>
  );
}
