"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon } from "lucide-react";

import type { FeedPost } from "@/lib/db/queries/community-posts";
import type { UnitDetail } from "@/lib/db/queries/community-units";
import { setCommunityUnitLeader } from "@/app/admin/_actions/community-actions";

import { Avatar } from "./avatar";
import { FeedComposer } from "./feed-composer";
import { PostList } from "./post-list";

type AdminMember = {
  enrollmentId: number;
  name: string;
  email: string;
  role: "member" | "leader";
};

export function CommunityUnitPage({
  detail,
  posts,
  viewerName = "You",
  isAdmin,
  canPost,
  adminMembers,
}: {
  detail: UnitDetail;
  posts: FeedPost[];
  viewerName?: string;
  isAdmin: boolean;
  canPost: boolean;
  adminMembers: AdminMember[];
}) {
  return (
    <div className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          {detail.name}
        </h1>
        <p className="text-sm text-zinc-500">
          {detail.memberCount} member{detail.memberCount === 1 ? "" : "s"}
          {detail.leader
            ? ` · led by ${detail.leader.firstName}`
            : " · no leader yet"}
          {detail.status === "archived" ? " · archived" : ""}
        </p>
        {detail.telegramUrl ? (
          <a
            href={detail.telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="w-fit text-sm font-medium text-[var(--color-brand-blue)] underline underline-offset-4"
          >
            Open this unit&apos;s Telegram
          </a>
        ) : null}
      </header>

      <section className="overflow-hidden rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)">
        <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
          <UsersIcon
            className="size-4 text-[var(--color-brand-blue)]"
            strokeWidth={2}
          />
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Members
          </h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {detail.members.map((member, index) => (
            <li
              key={`${member.firstName}-${index}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-2.5 font-medium text-zinc-900">
                <Avatar name={member.firstName} size={28} />
                {member.firstName}
                {member.isLeader ? (
                  <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand-blue)]">
                    leader
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{member.stageLabel}</span>
                <span className="text-zinc-400">
                  joined {member.joinedMonth}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
        Unit posts
      </h2>
      {canPost ? (
        <FeedComposer
          viewerName={viewerName}
          unitName={detail.name}
          defaultScope="unit"
          lockScope
        />
      ) : null}
      <PostList
        posts={posts}
        viewerName={viewerName}
        viewerUnitName={canPost ? detail.name : null}
        canPost={canPost}
        isAdmin={isAdmin}
        emptyText="No unit posts yet."
      />

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
        Admin · unit leader
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
