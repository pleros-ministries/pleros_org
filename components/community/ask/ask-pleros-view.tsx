"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { QUESTION_BODY_MAX } from "@/lib/community/ask-pleros";
import { relativeTime } from "@/lib/community/time";
import type { AskerQuestionSummary } from "@/lib/db/queries/ask-pleros";
import { askPleros } from "@/app/(site)/dashboard/community/_actions/ask-actions";

const card =
  "rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)";

const VISIBILITY_OPTIONS = [
  {
    value: "anonymous",
    label: "Ask anonymously",
    help: "Pleros will not see who you are. The reply still comes to you here.",
  },
  {
    value: "named",
    label: "Show my name",
    help: "Pleros will see your name and your location group.",
  },
] as const;

export const QUESTION_STATUS_LABEL = {
  open: "Waiting for Pleros",
  answered: "Pleros replied",
  closed: "Closed",
} as const;

function AskForm() {
  const router = useRouter();
  const [body, setBody] = useState("");
  // The asker chooses every time; nothing is preselected.
  const [visibility, setVisibility] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!visibility) {
      setError("Choose whether to ask anonymously or show your name.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await askPleros({ body, visibility });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push(`/dashboard/community/ask/${result.id}`);
      } catch {
        setError("Could not send your question. Try again.");
      }
    });
  }

  return (
    <form
      className={`${card} grid gap-4 p-4 sm:p-5`}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <label className="grid gap-1 text-[13px] font-medium text-zinc-700">
        Your question *
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={QUESTION_BODY_MAX}
          required
          placeholder="Ask anything. Only the Pleros team will read it."
          className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-base font-normal leading-relaxed outline-none focus:border-zinc-300"
        />
      </label>

      <fieldset className="grid gap-2.5">
        <legend className="mb-1.5 text-[13px] font-medium text-zinc-700">
          How do you want to ask? *
        </legend>
        {VISIBILITY_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-start gap-2.5">
            <input
              type="radio"
              name="ask-visibility"
              value={option.value}
              checked={visibility === option.value}
              onChange={() => setVisibility(option.value)}
              className="mt-1 size-4 accent-[var(--color-brand-blue)]"
            />
            <span className="grid">
              <span className="text-sm font-medium text-zinc-900">
                {option.label}
              </span>
              <span className="text-xs text-zinc-500">{option.help}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {error ? (
        <p role="alert" className="text-[13px] text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 w-fit items-center rounded-full bg-(--color-brand-blue) px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send to Pleros"}
      </button>
    </form>
  );
}

/** Ask the ministry a private question, and see the conversations already started. */
export function AskPlerosView({
  questions,
}: {
  questions: AskerQuestionSummary[];
}) {
  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Ask Pleros
        </h1>
        <p className="max-w-md text-sm text-zinc-500">
          Ask the Pleros team a question in private. No one else in the
          community sees it, and you choose whether we see your name.
        </p>
      </header>

      <AskForm />

      <section className={`${card} overflow-hidden`}>
        <h2 className="ppc-heading border-b border-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900">
          Your questions
        </h2>
        {questions.length === 0 ? (
          <p className="px-4 py-4 text-sm text-zinc-500">
            You have not asked anything yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {questions.map((question) => (
              <li key={question.id}>
                <Link
                  href={`/dashboard/community/ask/${question.id}`}
                  className="grid gap-1 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <span
                    className={`line-clamp-2 text-sm text-zinc-900 ${
                      question.unread ? "font-semibold" : ""
                    }`}
                  >
                    {question.preview}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                        question.status === "answered"
                          ? "bg-(--muted) text-(--color-brand-blue)"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {QUESTION_STATUS_LABEL[question.status]}
                    </span>
                    {question.isAnonymous ? <span>Anonymous</span> : null}
                    <span>{relativeTime(question.lastMessageAt)}</span>
                    {question.unread ? (
                      <span className="font-medium text-(--color-brand-blue)">
                        New reply
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
