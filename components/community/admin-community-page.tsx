"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { UnitWithCounts } from "@/lib/db/queries/community-units";
import type { AdminPost } from "@/lib/db/queries/community-posts";
import {
  backfillCommunityUnits,
  moderatePost,
  publishGlobalPost,
  togglePostPinned,
  updateUnitStatus,
  updateUnitTelegramUrl,
} from "@/app/admin/_actions/community-actions";

export function AdminCommunityPage({
  units,
  posts,
  enrolmentCount,
  memberCount,
}: {
  units: UnitWithCounts[];
  posts: AdminPost[];
  enrolmentCount: number;
  memberCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const unplaced = enrolmentCount - memberCount;

  function run(action: () => Promise<unknown>, note?: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (note) setMessage(note);
        else if (
          result &&
          typeof result === "object" &&
          "assigned" in result
        ) {
          const r = result as { total: number; assigned: number; failed: number };
          setMessage(
            `Backfill: ${r.assigned}/${r.total} placed, ${r.failed} failed.`,
          );
        }
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Action failed.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Community units
        </h1>
        <p className="text-xs text-zinc-500">
          {enrolmentCount} enrolments · {memberCount} placed in a unit
          {unplaced > 0 ? ` · ${unplaced} not yet placed` : ""}.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => backfillCommunityUnits())}
          className="inline-flex h-9 items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Working…" : "Run unit backfill"}
        </button>
        {message ? (
          <span className="text-xs text-zinc-600" role="status">
            {message}
          </span>
        ) : null}
      </div>

      <section className="grid gap-3 rounded-sm border border-zinc-200 bg-white p-4">
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Official post
        </h2>
        <GlobalPostComposer
          disabled={pending}
          onPublish={(input) =>
            run(() => publishGlobalPost(input), "Official post published.")
          }
        />
        {posts.length > 0 ? (
          <ul className="grid gap-2 border-t border-zinc-100 pt-3">
            {posts.map((post) => (
              <li
                key={post.id}
                className="grid gap-1 text-xs text-zinc-600"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">
                    {post.title ?? post.body.slice(0, 48)}
                  </span>
                  {post.pinned ? (
                    <span className="text-[var(--color-brand-blue)]">pinned</span>
                  ) : null}
                  {post.status !== "published" ? (
                    <span className="text-amber-700">{post.status}</span>
                  ) : null}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          togglePostPinned({
                            postId: post.id,
                            pinned: !post.pinned,
                          }),
                        post.pinned ? "Unpinned." : "Pinned.",
                      )
                    }
                    className="text-[var(--color-brand-blue)] underline underline-offset-2"
                  >
                    {post.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          moderatePost({
                            postId: post.id,
                            status:
                              post.status === "published"
                                ? "hidden"
                                : "published",
                          }),
                        post.status === "published" ? "Hidden." : "Restored.",
                      )
                    }
                    className="text-[var(--color-brand-blue)] underline underline-offset-2"
                  >
                    {post.status === "published" ? "Hide" : "Restore"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="overflow-x-auto rounded-sm border border-zinc-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Unit</th>
              <th className="px-3 py-2 font-medium">Members</th>
              <th className="px-3 py-2 font-medium">Leader</th>
              <th className="px-3 py-2 font-medium">Telegram</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {units.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                  No units yet. Run the backfill to create them from enrolments.
                </td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.id} className={unit.status === "archived" ? "opacity-50" : ""}>
                  <td className="px-3 py-2 font-medium text-zinc-900">{unit.name}</td>
                  <td className="px-3 py-2">{unit.memberCount}</td>
                  <td className="px-3 py-2">{unit.leaderName ?? "—"}</td>
                  <td className="px-3 py-2">
                    <TelegramCell
                      unitId={unit.id}
                      current={unit.telegramUrl}
                      disabled={pending}
                      onSave={(url) =>
                        run(
                          () =>
                            updateUnitTelegramUrl({ unitId: unit.id, telegramUrl: url }),
                          "Telegram link saved.",
                        )
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        run(
                          () =>
                            updateUnitStatus({
                              unitId: unit.id,
                              status:
                                unit.status === "active" ? "archived" : "active",
                            }),
                          unit.status === "active" ? "Archived." : "Restored.",
                        )
                      }
                      className="text-[var(--color-brand-blue)] underline underline-offset-2"
                    >
                      {unit.status === "active" ? "Archive" : "Restore"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GlobalPostComposer({
  disabled,
  onPublish,
}: {
  disabled: boolean;
  onPublish: (input: {
    title: string;
    body: string;
    alsoTelegram: boolean;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [alsoTelegram, setAlsoTelegram] = useState(false);

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) return;
        onPublish({ title, body, alsoTelegram });
        setTitle("");
        setBody("");
        setAlsoTelegram(false);
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title (optional)"
        className="h-9 rounded-sm border border-zinc-200 px-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Write an update for every enrolled learner…"
        rows={3}
        className="rounded-sm border border-zinc-200 p-2 text-sm"
      />
      <label className="flex items-center gap-2 text-xs text-zinc-600">
        <input
          type="checkbox"
          checked={alsoTelegram}
          onChange={(event) => setAlsoTelegram(event.target.checked)}
        />
        Also post to the SOGP Telegram channel
      </label>
      <button
        type="submit"
        disabled={disabled || !body.trim()}
        className="inline-flex h-8 w-fit items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
      >
        Publish
      </button>
    </form>
  );
}

function TelegramCell({
  current,
  disabled,
  onSave,
}: {
  unitId: number;
  current: string | null;
  disabled: boolean;
  onSave: (url: string) => void;
}) {
  const [value, setValue] = useState(current ?? "");
  const dirty = value !== (current ?? "");
  return (
    <span className="flex items-center gap-1.5">
      <input
        type="url"
        value={value}
        placeholder="https://t.me/…"
        onChange={(event) => setValue(event.target.value)}
        className="h-7 w-44 rounded-sm border border-zinc-200 px-2 text-xs"
      />
      {dirty ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSave(value)}
          className="text-[var(--color-brand-blue)] underline underline-offset-2"
        >
          Save
        </button>
      ) : null}
    </span>
  );
}
