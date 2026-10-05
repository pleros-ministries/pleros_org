"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  STAFF_REPLY_MAX,
  staffAskerLabel,
  type QuestionStatus,
} from "@/lib/community/ask-pleros";
import { relativeTime } from "@/lib/community/time";
import type {
  StaffQuestion,
  StaffQuestionSummary,
} from "@/lib/db/queries/ask-pleros";
import {
  mutePlerosAsker,
  replyToPlerosQuestion,
  setPlerosQuestionStatus,
} from "@/app/admin/_actions/ask-pleros-actions";

const STATUS_TABS: Array<{ key: QuestionStatus; label: string }> = [
  { key: "open", label: "Needs a reply" },
  { key: "answered", label: "Answered" },
  { key: "closed", label: "Closed" },
];

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Africa/Lagos",
});

/**
 * The Ask Pleros inbox. Everything shown about an asker comes from the staff
 * view, so an anonymous question shows "Anonymous" and nothing more.
 */
export function AdminQuestionsPage({
  questions,
  selected,
  inboxConfigured,
}: {
  questions: StaffQuestionSummary[];
  selected: StaffQuestion | null;
  inboxConfigured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<QuestionStatus>(selected?.status ?? "open");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const counts: Record<QuestionStatus, number> = {
    open: 0,
    answered: 0,
    closed: 0,
  };
  for (const question of questions) counts[question.status] += 1;
  const visible = questions.filter((question) => question.status === tab);

  function run(action: () => Promise<unknown>, note: string, onDone?: () => void) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        const error =
          result && typeof result === "object" && "error" in result
            ? (result as { error: string | null }).error
            : null;
        if (error) {
          setMessage(error);
          return;
        }
        onDone?.();
        setMessage(note);
        router.refresh();
      } catch {
        setMessage("Action failed. Try again.");
      }
    });
  }

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Ask Pleros
        </h1>
        <p className="text-xs text-zinc-500">
          Private questions from learners. Replies are sent as “Pleros”. When
          someone asks anonymously, their identity is not shown here or in the
          email.
        </p>
      </header>

      {inboxConfigured ? null : (
        <p className="rounded-sm border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          No inbox address is set, so new questions are not being emailed. Set
          ASK_PLEROS_INBOX_EMAIL (or CONTACT_INBOX_EMAIL) to receive them.
          Questions still arrive on this page.
        </p>
      )}

      <div className="flex gap-4 border-b border-zinc-200">
        {STATUS_TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2 text-xs font-medium ${
                active
                  ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {item.label}
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[0.65rem] text-zinc-600">
                {counts[item.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_2fr] lg:items-start">
        <section className="overflow-hidden rounded-sm border border-zinc-200 bg-white">
          {visible.length === 0 ? (
            <p className="p-4 text-xs text-zinc-500">Nothing here.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {visible.map((question) => {
                const active = question.id === selected?.id;
                return (
                  <li key={question.id}>
                    <Link
                      href={`/admin/questions?question=${question.id}`}
                      scroll={false}
                      className={`grid gap-1 px-3 py-2.5 text-xs ${
                        active ? "bg-zinc-100" : "hover:bg-zinc-50"
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-zinc-900">
                          {staffAskerLabel(question.asker)}
                        </span>
                        <span className="shrink-0 text-zinc-400">
                          {relativeTime(question.lastMessageAt)}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-zinc-600">
                        {question.preview}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="grid gap-3 rounded-sm border border-zinc-200 bg-white p-4">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="grid gap-0.5">
                  <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
                    {staffAskerLabel(selected.asker)}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {selected.asker.anonymous
                      ? "Asked anonymously. The reply still reaches them."
                      : (selected.asker.groupName ?? "No location group")}
                    {" · "}
                    {timeFmt.format(new Date(selected.createdAt))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          setPlerosQuestionStatus({
                            questionId: selected.id,
                            status: selected.status === "closed" ? "open" : "closed",
                          }),
                        selected.status === "closed"
                          ? "Conversation reopened."
                          : "Conversation closed.",
                      )
                    }
                    className="text-[var(--color-brand-blue)] underline underline-offset-2"
                  >
                    {selected.status === "closed" ? "Reopen" : "Close"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Close this conversation and stop further questions from this person? You will not be told who they are.",
                        )
                      ) {
                        run(
                          () => mutePlerosAsker(selected.id),
                          "Conversation closed. This person can no longer send questions.",
                        );
                      }
                    }}
                    className="text-red-700 underline underline-offset-2"
                  >
                    Stop questions from this person
                  </button>
                </div>
              </div>

              <ol className="grid gap-2 border-t border-zinc-100 pt-3">
                {selected.messages.map((item) => (
                  <li
                    key={item.id}
                    className={`grid gap-1 rounded-sm border p-3 text-sm ${
                      item.fromStaff
                        ? "border-zinc-200 bg-zinc-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      {item.fromStaff
                        ? "Pleros"
                        : staffAskerLabel(selected.asker)}
                      {" · "}
                      {timeFmt.format(new Date(item.createdAt))}
                    </span>
                    <span className="whitespace-pre-line text-zinc-800">
                      {item.body}
                    </span>
                  </li>
                ))}
              </ol>

              {selected.status === "closed" ? (
                <p className="text-xs text-zinc-500">
                  This conversation is closed. Reopen it to reply.
                </p>
              ) : (
                <form
                  className="grid gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(
                      () =>
                        replyToPlerosQuestion({
                          questionId: selected.id,
                          body: reply,
                        }),
                      "Reply sent.",
                      () => setReply(""),
                    );
                  }}
                >
                  <label className="grid gap-1 text-xs font-medium text-zinc-700">
                    Reply as Pleros
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      rows={5}
                      maxLength={STAFF_REPLY_MAX}
                      className="rounded-sm border border-zinc-200 p-2 text-sm font-normal"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={pending || !reply.trim()}
                    className="inline-flex h-9 w-fit items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {pending ? "Sending…" : "Send reply"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-500">
              Select a question to read it and reply.
            </p>
          )}

          {message ? (
            <p role="status" className="text-xs text-zinc-600">
              {message}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
