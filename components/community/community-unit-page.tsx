"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { FeedPost } from "@/lib/db/queries/community-posts";
import type { UnitDetail } from "@/lib/db/queries/community-units";
import { setCommunityUnitLeader } from "@/app/admin/_actions/community-actions";

import { Avatar } from "./avatar";
import { FeedComposer, type OfficialReach } from "./feed-composer";
import { MessageButton } from "./messages/message-button";
import { PostFeed } from "./post-feed";

type AdminMember = {
  enrollmentId: number;
  name: string;
  email: string;
  role: "member" | "leader";
};

type TabKey = "discussions" | "members" | "about";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

export function CommunityUnitPage({
  detail,
  initialPosts,
  initialNextOffset,
  viewerName = "You",
  isAdmin,
  canPost,
  canRepost,
  officialReach,
  postingBlocked,
  adminMembers,
}: {
  detail: UnitDetail;
  initialPosts: FeedPost[];
  initialNextOffset: number | null;
  viewerName?: string;
  isAdmin: boolean;
  /** The viewer belongs to this group. */
  canPost: boolean;
  canRepost: boolean;
  officialReach: OfficialReach;
  postingBlocked: boolean;
  adminMembers: AdminMember[];
}) {
  const [tab, setTab] = useState<TabKey>("discussions");
  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "discussions", label: "Discussions" },
    { key: "members", label: "Members", count: detail.memberCount },
    { key: "about", label: "About" },
  ];

  return (
    <div className="grid gap-4">
      <header className={`${card} grid gap-3 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1">
            <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
              {detail.name}
            </h1>
            <p className="text-sm text-zinc-500">
              {detail.memberCount} member{detail.memberCount === 1 ? "" : "s"}
              {detail.pastor ? ` · Pastor ${detail.pastor.firstName}` : ""}
              {detail.leader ? ` · led by ${detail.leader.firstName}` : ""}
              {!detail.pastor && !detail.leader ? " · no pastor assigned yet" : ""}
              {detail.status === "archived" ? " · archived" : ""}
            </p>
          </div>
          {detail.pastor?.messageUserId ? (
            <MessageButton
              userId={detail.pastor.messageUserId}
              label="Message pastor"
            />
          ) : detail.leader?.messageUserId ? (
            <MessageButton
              userId={detail.leader.messageUserId}
              label="Message leader"
            />
          ) : null}
        </div>

        <div
          role="tablist"
          aria-label="Group sections"
          className="-mb-4 flex gap-5 border-t border-zinc-100 pt-1 sm:-mb-5"
        >
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.key)}
                className={`-mb-px inline-flex items-center gap-1.5 border-b-2 py-2.5 text-sm font-medium transition-colors ${
                  active
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
      </header>

      {tab === "discussions" ? (
        <>
          {canPost ? (
            <FeedComposer
              viewerName={viewerName}
              unitName={detail.name}
              target={{ scope: "unit", id: detail.id }}
              officialReach={officialReach}
              postingBlocked={postingBlocked}
            />
          ) : null}
          <PostFeed
            source={{ type: "unit", id: detail.id }}
            initialPosts={initialPosts}
            initialNextOffset={initialNextOffset}
            viewerName={viewerName}
            viewerUnitName={canPost ? detail.name : null}
            canRepost={canRepost}
            isAdmin={isAdmin}
            emptyText="No posts in this group yet. Start a discussion to get things going."
          />
        </>
      ) : null}

      {tab === "members" ? (
        <section className={`${card} overflow-hidden`}>
          <ul className="divide-y divide-zinc-100">
            {detail.members.map((member, index) => (
              <li
                key={`${member.firstName}-${index}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <Avatar name={member.firstName} size={32} />
                  <span className="grid min-w-0">
                    <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                      <span className="truncate">{member.firstName}</span>
                      {member.isLeader ? (
                        <span className="rounded-full bg-(--muted) px-2 py-0.5 text-[0.7rem] font-medium text-(--color-brand-blue)">
                          Leader
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {member.stageLabel} · joined {member.joinedMonth}
                    </span>
                  </span>
                </span>
                {member.messageUserId ? (
                  <MessageButton userId={member.messageUserId} />
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "about" ? (
        <section className={`${card} grid gap-3 p-4 text-sm text-zinc-700 sm:p-5`}>
          <p>
            This is a location group. Location groups are formed automatically
            from the country or state each learner gave when they enrolled, and
            are looked after by the pastor assigned to that region.
          </p>
          <p>
            Raise a discussion, ask a question or share a testimony. Keep it
            kind, and use Report on anything that should not be here.
          </p>
          <dl className="grid gap-2 border-t border-zinc-100 pt-3 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Pastor</dt>
              <dd className="font-medium text-zinc-900">
                {detail.pastor?.firstName ?? "Not assigned yet"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Leader</dt>
              <dd className="font-medium text-zinc-900">
                {detail.leader?.firstName ?? "Not appointed yet"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Members</dt>
              <dd className="font-medium text-zinc-900">{detail.memberCount}</dd>
            </div>
          </dl>
          {detail.telegramUrl ? (
            <a
              href={detail.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-fit font-medium text-[var(--color-brand-blue)] underline underline-offset-4"
            >
              Open this group&apos;s Telegram
            </a>
          ) : null}
        </section>
      ) : null}

      {isAdmin ? (
        <AdminLeaderControl unitId={detail.id} members={adminMembers} />
      ) : null}
    </div>
  );
}

function AdminLeaderControl({
  unitId,
  members,
}: {
  unitId: number;
  members: AdminMember[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const currentLeader = members.find((m) => m.role === "leader") ?? null;
  const [selected, setSelected] = useState<string>(
    currentLeader ? String(currentLeader.enrollmentId) : "",
  );

  return (
    <section className="grid gap-2 rounded-sm border border-dashed border-zinc-300 bg-white p-4">
      <h2 className="ppc-heading text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        Admin · group leader
      </h2>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className="h-8 rounded-sm border border-zinc-200 px-2 text-xs"
        >
          <option value="">No leader</option>
          {members.map((member) => (
            <option key={member.enrollmentId} value={member.enrollmentId}>
              {member.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await setCommunityUnitLeader({
                unitId,
                enrollmentId: selected ? Number(selected) : null,
              });
              router.refresh();
            })
          }
          className="inline-flex h-8 items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save leader"}
        </button>
      </div>
    </section>
  );
}
