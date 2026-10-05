"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import { QUESTION_BODY_MAX } from "@/lib/community/ask-pleros";
import { communityKeys } from "@/lib/community/query-keys";
import { clockTime, dayKey, dayLabel } from "@/lib/community/time";
import type { AskerQuestion } from "@/lib/db/queries/ask-pleros";
import {
  markQuestionRead,
  revealQuestionIdentity,
  sendQuestionFollowUp,
} from "@/app/(site)/dashboard/community/_actions/ask-actions";

import { QUESTION_STATUS_LABEL } from "./ask-pleros-view";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

async function fetchQuestion(questionId: number): Promise<AskerQuestion> {
  const res = await fetch(`/api/community/ask/${questionId}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load the conversation");
  const data = (await res.json()) as { question: AskerQuestion };
  return data.question;
}

/** One private conversation with Pleros, as the person who asked sees it. */
export function QuestionThread({ initial }: { initial: AskerQuestion }) {
  const queryClient = useQueryClient();
  const questionKey = communityKeys.question(initial.id);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { data: question } = useQuery({
    queryKey: questionKey,
    queryFn: () => fetchQuestion(initial.id),
    initialData: initial,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });

  const newestReplyId = question.messages.reduce(
    (max, message) => (message.fromStaff && message.id > max ? message.id : max),
    0,
  );

  // Opening the conversation, or a reply arriving while it is open, marks it read.
  useEffect(() => {
    if (newestReplyId === 0) return;
    let cancelled = false;
    markQuestionRead(initial.id)
      .then(() => {
        if (cancelled) return;
        queryClient.invalidateQueries({
          queryKey: communityKeys.unreadQuestions(),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initial.id, newestReplyId, queryClient]);

  function act(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    onDone?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onDone?.();
        await queryClient.invalidateQueries({ queryKey: questionKey });
      } catch {
        setError("Something went wrong. Try again.");
      }
    });
  }

  const closed = question.status === "closed";

  return (
    <div className="grid gap-4">
      <Link
        href="/dashboard/community/ask"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-(--color-brand-blue)"
      >
        <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> All your questions
      </Link>

      <header className={`${card} grid gap-2 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            Your question to Pleros
          </h1>
          <span
            className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
              question.status === "answered"
                ? "bg-(--muted) text-(--color-brand-blue)"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {QUESTION_STATUS_LABEL[question.status]}
          </span>
        </div>
        {question.isAnonymous ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-600">
            You asked this anonymously. Pleros cannot see who you are.
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  window.confirm(
                    "Show your name to Pleros on this conversation? This cannot be undone.",
                  )
                ) {
                  act(() => revealQuestionIdentity(question.id));
                }
              }}
              className="font-medium text-(--color-brand-blue) underline underline-offset-2 disabled:opacity-60"
            >
              Share my name with Pleros
            </button>
          </p>
        ) : (
          <p className="text-[13px] text-zinc-600">
            Pleros can see your name on this conversation.
          </p>
        )}
      </header>

      <section className={`${card} p-3 sm:p-4`}>
        <ol className="grid gap-1.5">
          {question.messages.map((message, index) => {
            const previous = question.messages[index - 1];
            const newDay =
              !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
            return (
              <Fragment key={message.id}>
                {newDay ? (
                  <li className="my-2 text-center text-xs font-medium text-zinc-400">
                    {dayLabel(message.createdAt)}
                  </li>
                ) : null}
                <li
                  className={`flex flex-col ${
                    message.fromStaff ? "items-start" : "items-end"
                  }`}
                >
                  {message.fromStaff ? (
                    <p className="mb-0.5 px-1 text-[0.7rem] font-semibold text-(--color-brand-blue)">
                      Pleros
                    </p>
                  ) : null}
                  <p
                    className={`max-w-[85%] whitespace-pre-line break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      message.fromStaff
                        ? "border border-zinc-200 bg-zinc-50 text-zinc-800"
                        : "bg-(--color-brand-blue) text-white"
                    }`}
                  >
                    {message.body}
                  </p>
                  <p className="mt-0.5 px-1 text-[0.7rem] text-zinc-400">
                    {clockTime(message.createdAt)}
                  </p>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </section>

      {error ? (
        <p role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      {closed ? (
        <p className={`${card} p-4 text-sm text-zinc-600`}>
          This conversation is closed.{" "}
          <Link
            href="/dashboard/community/ask"
            className="font-medium text-(--color-brand-blue) underline underline-offset-2"
          >
            Ask a new question
          </Link>{" "}
          if you need more help.
        </p>
      ) : (
        <form
          className={`${card} grid gap-2 p-3 sm:p-4`}
          onSubmit={(event) => {
            event.preventDefault();
            const body = draft.trim();
            if (!body) return;
            act(
              () => sendQuestionFollowUp({ questionId: question.id, body }),
              () => setDraft(""),
            );
          }}
        >
          <label className="grid gap-1 text-[13px] font-medium text-zinc-700">
            Add to your question
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={QUESTION_BODY_MAX}
              className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-base font-normal leading-relaxed outline-none focus:border-zinc-300"
            />
          </label>
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="inline-flex h-9 w-fit items-center rounded-full bg-(--color-brand-blue) px-4 text-[13px] font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}
