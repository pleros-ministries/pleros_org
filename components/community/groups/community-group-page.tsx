"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ArrowLeftIcon,
  GlobeIcon,
  LockIcon,
  SettingsIcon,
  ShieldIcon,
  UserMinusIcon,
  UserXIcon,
} from "lucide-react";

import type {
  GroupDetail,
  GroupMemberView,
} from "@/lib/db/queries/community-groups";
import type { FeedPost } from "@/lib/db/queries/community-posts";
import { relativeTime } from "@/lib/community/time";
import {
  leaveCommunityGroup,
  removeGroupMember,
  respondToGroupRequest,
  setCommunityGroupArchived,
  setGroupMemberModerator,
  updateCommunityGroup,
} from "@/app/(site)/dashboard/community/_actions/group-actions";

import { ActionMenu, type MenuAction } from "../action-menu";
import { Avatar } from "../avatar";
import { FeedComposer } from "../feed-composer";
import { MessageButton } from "../messages/message-button";
import { PostFeed } from "../post-feed";
import { GroupFormFields, type GroupFormValues } from "./group-form";
import { GroupJoinButton } from "./group-join-button";
import { useGroupAction } from "./use-group-action";

type TabKey = "discussions" | "members" | "requests" | "about";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

const ROLE_LABEL = { owner: "Owner", moderator: "Moderator", member: null } as const;

/**
 * One member-created group: its discussions, members, requests to join and
 * settings. What the viewer sees and can do comes from `detail.viewer`, which
 * the server computed from the group's privacy and their membership.
 */
export function CommunityGroupPage({
  detail,
  initialPosts,
  initialNextOffset,
  viewerName,
  isAdmin,
  postingBlocked,
}: {
  detail: GroupDetail;
  initialPosts: FeedPost[];
  initialNextOffset: number | null;
  viewerName: string;
  isAdmin: boolean;
  postingBlocked: boolean;
}) {
  const { viewer } = detail;
  const [tab, setTab] = useState<TabKey>("discussions");
  const [editing, setEditing] = useState(false);
  const { run, pending, error } = useGroupAction();

  const archived = detail.status === "archived";
  const canEdit = viewer.isOwner || isAdmin;
  const PrivacyIcon = detail.privacy === "public" ? GlobeIcon : LockIcon;

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "discussions", label: "Discussions" },
    { key: "members", label: "Members", count: detail.memberCount },
    ...(viewer.canManage && detail.privacy === "private"
      ? [
          {
            key: "requests" as const,
            label: "Requests",
            count: detail.requests.length,
          },
        ]
      : []),
    { key: "about", label: "About" },
  ];

  const groupActions: MenuAction[] = canEdit
    ? [
        {
          key: "edit",
          label: "Edit group",
          icon: SettingsIcon,
          onSelect: () => {
            setTab("about");
            setEditing(true);
          },
        },
        archived
          ? {
              key: "reopen",
              label: "Reopen group",
              icon: ArchiveRestoreIcon,
              onSelect: () =>
                run(() =>
                  setCommunityGroupArchived({
                    groupId: detail.id,
                    archived: false,
                  }),
                ),
            }
          : {
              key: "close",
              label: "Close group",
              icon: ArchiveIcon,
              danger: true,
              onSelect: () => {
                if (
                  window.confirm(
                    "Close this group? Members will no longer see it. You can reopen it later.",
                  )
                ) {
                  run(() =>
                    setCommunityGroupArchived({
                      groupId: detail.id,
                      archived: true,
                    }),
                  );
                }
              },
            },
      ]
    : [];

  function memberActions(member: GroupMemberView): MenuAction[] {
    if (!member.manageable) return [];
    const actions: MenuAction[] = [];
    if (canEdit) {
      const isModerator = member.role === "moderator";
      actions.push({
        key: "moderator",
        label: isModerator ? "Remove as moderator" : "Make moderator",
        icon: ShieldIcon,
        onSelect: () =>
          run(() =>
            setGroupMemberModerator({
              memberId: member.memberId,
              moderator: !isModerator,
            }),
          ),
      });
    }
    actions.push(
      {
        key: "remove",
        label: "Remove from group",
        icon: UserMinusIcon,
        onSelect: () =>
          run(() => removeGroupMember({ memberId: member.memberId, block: false })),
      },
      {
        key: "block",
        label: "Remove and block",
        icon: UserXIcon,
        danger: true,
        onSelect: () => {
          if (
            window.confirm(
              `Remove ${member.firstName} and stop them rejoining this group?`,
            )
          ) {
            run(() =>
              removeGroupMember({ memberId: member.memberId, block: true }),
            );
          }
        },
      },
    );
    return actions;
  }

  return (
    <div className="grid gap-4">
      <Link
        href="/dashboard/community/groups"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-(--color-brand-blue)"
      >
        <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> All groups
      </Link>

      <header className={`${card} grid gap-3 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid min-w-0 gap-1.5">
            <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
              {detail.name}
            </h1>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.7rem] font-medium text-zinc-600">
                <PrivacyIcon className="size-3" strokeWidth={2} />
                {detail.privacy === "public" ? "Public group" : "Private group"}
              </span>
              {archived ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[0.7rem] font-medium text-amber-700">
                  Closed
                </span>
              ) : null}
              {detail.memberCount} member{detail.memberCount === 1 ? "" : "s"}
            </p>
            {detail.description ? (
              <p className="max-w-prose whitespace-pre-line text-sm text-zinc-700">
                {detail.description}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <GroupJoinButton groupId={detail.id} join={viewer.join} />
            {viewer.isMember && !viewer.isOwner ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (window.confirm("Leave this group?")) {
                    run(() => leaveCommunityGroup(detail.id));
                  }
                }}
                className="inline-flex h-9 items-center rounded-full border border-(--color-line-strong) bg-white px-4 text-[13px] font-medium text-zinc-600 disabled:opacity-60"
              >
                Leave group
              </button>
            ) : null}
            <ActionMenu label="Group options" actions={groupActions} />
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        <div
          role="tablist"
          aria-label="Group sections"
          className="-mb-4 flex gap-5 overflow-x-auto border-t border-zinc-100 pt-1 sm:-mb-5"
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
                className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 py-2.5 text-sm font-medium transition-colors ${
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
      </header>

      {tab === "discussions" ? (
        !viewer.canView ? (
          <p className={`${card} p-4 text-sm text-zinc-600`}>
            {archived
              ? "This group is closed."
              : "This is a private group. Only its members can see what is shared here."}
          </p>
        ) : (
          <>
            {archived ? (
              <p className={`${card} p-4 text-sm text-zinc-600`}>
                This group is closed, so nothing new can be posted.
              </p>
            ) : viewer.canPost ? (
              <FeedComposer
                viewerName={viewerName}
                unitName={null}
                target={{ scope: "group", id: detail.id }}
                officialReach={viewer.canManage ? "all" : "none"}
                postingBlocked={postingBlocked}
              />
            ) : (
              <p className={`${card} p-4 text-sm text-zinc-600`}>
                Join this group to post and comment.
              </p>
            )}
            <PostFeed
              source={{ type: "group", id: detail.id }}
              initialPosts={initialPosts}
              initialNextOffset={initialNextOffset}
              viewerName={viewerName}
              viewerUnitName={null}
              canRepost={false}
              isAdmin={viewer.canManage}
              emptyText="Nothing here yet. Start the first discussion."
            />
          </>
        )
      ) : null}

      {tab === "members" ? (
        viewer.canView ? (
          <section className={`${card} overflow-hidden`}>
            <ul className="divide-y divide-zinc-100">
              {detail.members.map((member) => {
                const role = ROLE_LABEL[member.role];
                return (
                  <li
                    key={member.memberId}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={member.firstName} size={32} />
                      <span className="grid min-w-0">
                        <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                          <span className="truncate">
                            {member.firstName}
                            {member.isYou ? " (you)" : ""}
                          </span>
                          {role ? (
                            <span className="rounded-full bg-(--muted) px-2 py-0.5 text-[0.7rem] font-medium text-(--color-brand-blue)">
                              {role}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-xs text-zinc-500">
                          Joined {member.joinedMonth}
                        </span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      {member.messageUserId ? (
                        <MessageButton userId={member.messageUserId} />
                      ) : null}
                      <ActionMenu
                        label={`Manage ${member.firstName}`}
                        actions={memberActions(member)}
                      />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <p className={`${card} p-4 text-sm text-zinc-600`}>
            Only members can see who is in a private group.
          </p>
        )
      ) : null}

      {tab === "requests" ? (
        <section className={`${card} overflow-hidden`}>
          {detail.requests.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">
              No one is waiting to join.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {detail.requests.map((request) => (
                <li
                  key={request.memberId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={request.firstName} size={32} />
                    <span className="grid min-w-0">
                      <span className="truncate font-medium text-zinc-900">
                        {request.firstName}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Requested · {relativeTime(request.requestedAt)}
                      </span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          respondToGroupRequest({
                            memberId: request.memberId,
                            approve: true,
                          }),
                        )
                      }
                      className="inline-flex h-8 items-center rounded-full bg-(--color-brand-blue) px-3.5 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          respondToGroupRequest({
                            memberId: request.memberId,
                            approve: false,
                          }),
                        )
                      }
                      className="inline-flex h-8 items-center rounded-full border border-(--color-line-strong) bg-white px-3.5 text-xs font-medium text-zinc-600 disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "about" ? (
        <section className={`${card} grid gap-3 p-4 text-sm text-zinc-700 sm:p-5`}>
          {editing && canEdit ? (
            <GroupEditForm
              key={detail.id}
              groupId={detail.id}
              initial={{
                name: detail.name,
                description: detail.description,
                privacy: detail.privacy,
              }}
              onDone={() => setEditing(false)}
            />
          ) : (
            <>
              <p>
                {detail.description ||
                  "This group has not added a description yet."}
              </p>
              <dl className="grid gap-2 border-t border-zinc-100 pt-3 text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Privacy</dt>
                  <dd className="text-right font-medium text-zinc-900">
                    {detail.privacy === "public"
                      ? "Public: anyone in the community can read and join"
                      : "Private: only members see discussions; joining needs approval"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Members</dt>
                  <dd className="font-medium text-zinc-900">
                    {detail.memberCount}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">Started</dt>
                  <dd className="font-medium text-zinc-900">
                    {detail.createdMonth}
                  </dd>
                </div>
              </dl>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="w-fit font-medium text-(--color-brand-blue) underline underline-offset-4"
                >
                  Edit group
                </button>
              ) : null}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}

function GroupEditForm({
  groupId,
  initial,
  onDone,
}: {
  groupId: number;
  initial: GroupFormValues;
  onDone: () => void;
}) {
  const [values, setValues] = useState<GroupFormValues>(initial);
  const { run, pending, error } = useGroupAction();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => updateCommunityGroup({ groupId, ...values }), onDone);
      }}
    >
      <GroupFormFields values={values} onChange={setValues} />
      {error ? (
        <p role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-full bg-(--color-brand-blue) px-4 text-[13px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-zinc-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
