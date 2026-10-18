"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { QUESTION_BODY_MAX } from "@/lib/community/ask-pleros";
import { relativeTime } from "@/lib/community/time";
import type { AskerQuestionSummary } from "@/lib/db/queries/ask-pleros";
import { askPleros } from "@/app/(site)/dashboard/community/_actions/ask-actions";

const card =
  "rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white ";

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

function AskForm({ episode: linkedEpisode }: { episode?: { guid: string; title: string } }) {
  // The learner can drop the lesson or episode link to ask something general.
  const [episode, setEpisode] = useState(linkedEpisode);
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
        const result = await askPleros({ body, visibility, episodeGuid: episode?.guid, episodeTitle: episode?.title });
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
      className={`${card} grid gap-3.5 p-4`}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      {episode ? <div className="flex items-start gap-2 rounded-xl bg-[var(--color-community-canvas)] py-2 pl-3 pr-1.5 text-[13px] text-[var(--color-community-ink)]">
        <p className="min-w-0 flex-1 py-0.5">About this {episode.guid.startsWith("sogp-lesson-") ? "lesson" : "episode"}: {episode.title}</p>
        <button type="button" onClick={() => setEpisode(undefined)} aria-label="Remove the link and ask a general question" className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-[var(--color-text-muted)] hover:bg-white hover:text-[var(--color-community-ink)]"><XIcon className="size-4" aria-hidden /></button>
      </div> : null}
      <label className="grid gap-1 text-[13px] font-medium text-[var(--color-community-ink)]">
        Your question *
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={QUESTION_BODY_MAX}
          required
          placeholder="Ask anything. Only the Pleros team will read it."
          className="w-full resize-none rounded-[11px] border border-[var(--dashboard-panel-edge,#e2e5ea)] px-3 py-2.5 text-[16px] font-normal leading-[24px] outline-none focus:border-[var(--color-community-edge-strong)]"
        />
      </label>

      <fieldset className="grid gap-2.5">
        <legend className="mb-1.5 text-[13px] font-medium text-[var(--color-community-ink)]">
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
              <span className="text-[14px] font-medium leading-[20px] text-[var(--color-community-ink)]">
                {option.label}
              </span>
              <span className="text-[12px] leading-[17px] text-[var(--color-community-muted)]">{option.help}</span>
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
        className="inline-flex h-[38px] w-fit items-center rounded-[11px] bg-[var(--color-community-blue)] px-4 text-[14px] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send to Pleros"}
      </button>
    </form>
  );
}

/** Ask the ministry a private question, and see the conversations already started. */
export function AskPlerosView({
  questions,
  episode,
}: {
  questions: AskerQuestionSummary[];
  episode?: { guid: string; title: string };
}) {
  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <h1 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[21px] font-medium leading-[28px] tracking-[-0.02em] text-[var(--color-community-ink)]">
          Ask Pleros
        </h1>
        <p className="m-0 max-w-md text-[13px] leading-[20px] text-[var(--color-community-muted)]">
          Ask the Pleros team a question in private. No one else in the
          community sees it, and you choose whether we see your name.
        </p>
      </header>

      <AskForm episode={episode} />

      <section className={`${card} overflow-hidden`}>
        <h2 className="m-0 border-b border-[var(--color-line,#e7e9ec)] px-4 py-3 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-[var(--color-community-ink)]">
          Your questions
        </h2>
        {questions.length === 0 ? (
          <p className="m-0 px-4 py-4 text-[13px] leading-[20px] text-[var(--color-community-muted)]">
            You have not asked anything yet.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-line,#e7e9ec)]">
            {questions.map((question) => (
              <li key={question.id}>
                <Link
                  href={`/dashboard/community/ask/${question.id}`}
                  className="grid gap-1 px-4 py-3 transition-colors hover:bg-[var(--color-community-canvas)]"
                >
                  <span
                    className={`line-clamp-2 text-[14px] leading-[20px] text-[var(--color-community-ink)] ${
                      question.unread ? "font-semibold" : ""
                    }`}
                  >
                    {question.preview}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] leading-[16px] text-[var(--color-community-muted)]">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
                        question.status === "answered"
                          ? "bg-[var(--color-community-sky-soft)] text-[var(--color-community-blue)]"
                          : "bg-[var(--color-community-canvas)] text-[var(--color-community-ink)]"
                      }`}
                    >
                      {QUESTION_STATUS_LABEL[question.status]}
                    </span>
                    {question.isAnonymous ? <span>Anonymous</span> : null}
                    {question.episodeTitle ? <span>About: {question.episodeTitle}</span> : null}
                    <span>{relativeTime(question.lastMessageAt)}</span>
                    {question.unread ? (
                      <span className="font-medium text-[var(--color-community-blue)]">
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
