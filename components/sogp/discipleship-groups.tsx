"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  closeDiscipleshipGroupAction,
  createDiscipleshipGroupAction,
  renameDiscipleshipGroupAction,
} from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import type { LedGroupSummary } from "@/lib/db/queries/sogp-discipleship";
import {
  DISCIPLESHIP_GROUP_MAX,
  DISCIPLESHIP_GROUP_NAME_MAX,
  evaluateCloseDiscipleshipGroup,
} from "@/lib/sogp/discipleship";

import { useDiscipleshipAction } from "./discipleship-check-ins";

const PAGE_PATH = "/dashboard/sogp/discipleship";

const inputClass =
  "h-10 w-full rounded-sm border border-zinc-200 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:border-[var(--color-brand-blue)] focus-visible:outline-none sm:text-sm";
const primaryButtonClass =
  "inline-flex min-h-9 items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-medium text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60";
const quietButtonClass =
  "text-xs font-medium text-[var(--color-brand-blue)] underline-offset-4 hover:underline disabled:opacity-60";
const chipClass =
  "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-150";

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-xs text-red-700">
      {error}
    </p>
  ) : null;
}

/**
 * The learner's own groups as a row of chips, plus the form that starts a new
 * one. Each chip links to `?group=<id>`, so the server loads one group's
 * disciples at a time.
 */
export function GroupSwitcher({
  groups,
  selectedId,
  createBlock,
  preview,
}: {
  groups: LedGroupSummary[];
  selectedId: number;
  /** Why another group can't be started, or null when it can. */
  createBlock: string | null;
  preview: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <div className="grid gap-2 lg:col-span-2">
      <nav aria-label="Groups you lead" className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {groups.map((group) => {
          const selected = group.id === selectedId;
          const tone = selected
            ? "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] text-white"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300";
          const label = (
            <>
              <span className="max-w-[11rem] truncate">{group.name}</span>
              <span className={selected ? "text-white/75" : "text-zinc-400"}>
                {group.status === "archived" ? "Paused" : group.discipleCount}
              </span>
            </>
          );
          // The preview route has no server data to switch between.
          return preview ? (
            <span key={group.id} className={`${chipClass} ${tone}`}>
              {label}
            </span>
          ) : (
            <Link
              key={group.id}
              href={`${PAGE_PATH}?group=${group.id}`}
              scroll={false}
              aria-current={selected ? "page" : undefined}
              className={`${chipClass} ${tone}`}
            >
              {label}
            </Link>
          );
        })}
        {!createBlock && !creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={`${chipClass} border-dashed border-zinc-300 bg-transparent text-[var(--color-brand-blue)] hover:border-[var(--color-brand-blue)]`}
          >
            <PlusIcon className="size-3.5" strokeWidth={2} /> New group
          </button>
        ) : null}
      </nav>

      {createBlock ? <p className="text-[0.7rem] text-zinc-500">{createBlock}</p> : null}

      {creating ? (
        <form
          className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-3 sm:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            let createdId: number | undefined;
            run(
              async () => {
                const result = await createDiscipleshipGroupAction({ name });
                if (result.ok) createdId = result.groupId;
                return result;
              },
              () => {
                setName("");
                setCreating(false);
                if (createdId) router.push(`${PAGE_PATH}?group=${createdId}`, { scroll: false });
              },
            );
          }}
        >
          <label
            htmlFor="new-discipleship-group"
            className="text-[0.8125rem] font-medium text-zinc-900"
          >
            Name your new group
          </label>
          <input
            id="new-discipleship-group"
            type="text"
            value={name}
            maxLength={DISCIPLESHIP_GROUP_NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            placeholder="For example, Family or Campus fellowship"
            className={inputClass}
          />
          <p className="text-[0.7rem] text-zinc-500">
            Each group has its own invite link and up to {DISCIPLESHIP_GROUP_MAX} disciples.
          </p>
          <ErrorText error={error} />
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setName("");
              }}
              className={quietButtonClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={pending || !name.trim()} className={primaryButtonClass}>
              Create group
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/** The selected group's name and size, with rename and close for its leader. */
export function GroupHeader({
  group,
  discipleCount,
  openGroupCount,
  preview,
}: {
  group: { id: number; name: string; status: "active" | "archived" };
  discipleCount: number;
  /** How many open groups the leader has; the last one can't be closed. */
  openGroupCount: number;
  preview: boolean;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const rename = useDiscipleshipAction(preview);
  const close = useDiscipleshipAction(preview);
  const paused = group.status === "archived";
  const canClose = evaluateCloseDiscipleshipGroup({
    status: group.status,
    openGroupCount,
  }).ok;

  return (
    <div className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4 lg:col-span-2">
      {renaming ? (
        <form
          className="grid gap-2 sm:max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            rename.run(
              () => renameDiscipleshipGroupAction({ groupId: group.id, name }),
              () => setRenaming(false),
            );
          }}
        >
          <label
            htmlFor={`rename-group-${group.id}`}
            className="text-[0.8125rem] font-medium text-zinc-900"
          >
            Group name
          </label>
          <input
            id={`rename-group-${group.id}`}
            type="text"
            value={name}
            maxLength={DISCIPLESHIP_GROUP_NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
          <ErrorText error={rename.error} />
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setRenaming(false)} className={quietButtonClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={rename.pending || !name.trim()}
              className={primaryButtonClass}
            >
              Save name
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="grid min-w-0 gap-0.5">
            <h2 className="ppc-heading break-words text-base font-semibold text-zinc-900">
              {group.name}
            </h2>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">
              {discipleCount} of {DISCIPLESHIP_GROUP_MAX} disciples
            </p>
          </div>
          {!paused ? (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setName(group.name);
                  setRenaming(true);
                }}
                className={quietButtonClass}
              >
                Rename
              </button>
              {canClose ? (
                <button
                  type="button"
                  disabled={close.pending}
                  onClick={() => {
                    const released =
                      discipleCount > 0
                        ? ` and its ${discipleCount} disciple${discipleCount === 1 ? "" : "s"} will be released`
                        : "";
                    if (
                      window.confirm(
                        `Close ${group.name}? Its invite link will stop working${released}. This can't be undone.`,
                      )
                    ) {
                      close.run(
                        () => closeDiscipleshipGroupAction({ groupId: group.id }),
                        () => router.replace(PAGE_PATH, { scroll: false }),
                      );
                    }
                  }}
                  className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline disabled:opacity-60"
                >
                  Close group
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
      <ErrorText error={close.error} />
    </div>
  );
}
