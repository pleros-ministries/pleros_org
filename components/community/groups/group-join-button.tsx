"use client";

import type { GroupJoinDecision } from "@/lib/community/groups";
import {
  joinCommunityGroup,
  leaveCommunityGroup,
} from "@/app/(site)/dashboard/community/_actions/group-actions";

import { useGroupAction } from "./use-group-action";

const primary =
  "inline-flex h-9 items-center rounded-full bg-(--color-brand-blue) px-4 text-[13px] font-semibold text-white disabled:opacity-60";
const quiet =
  "inline-flex h-9 items-center rounded-full border border-(--color-line-strong) bg-white px-4 text-[13px] font-medium text-zinc-600 disabled:opacity-60";

/**
 * Join a public group, ask to join a private one, or withdraw a pending
 * request. Renders nothing for members and for groups the viewer cannot join.
 */
export function GroupJoinButton({
  groupId,
  join,
}: {
  groupId: number;
  join: GroupJoinDecision;
}) {
  const { run, pending, error } = useGroupAction();

  let button = null;
  if (join.action === "join" || join.action === "request") {
    button = (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => joinCommunityGroup(groupId))}
        className={primary}
      >
        {pending
          ? "Joining…"
          : join.action === "join"
            ? "Join group"
            : "Request to join"}
      </button>
    );
  } else if (join.reason === "pending") {
    button = (
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => leaveCommunityGroup(groupId))}
        className={quiet}
      >
        {pending ? "Cancelling…" : "Requested · Cancel"}
      </button>
    );
  }
  if (!button) return null;

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      {button}
      {error ? (
        <span role="alert" className="max-w-52 text-right text-xs text-red-700">
          {error}
        </span>
      ) : null}
    </span>
  );
}
