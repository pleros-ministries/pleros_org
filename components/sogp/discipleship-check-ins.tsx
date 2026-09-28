"use client";

import { LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import {
  answerDiscipleshipPromptAction,
  createDiscipleshipPromptAction,
  replyToDiscipleshipAnswerAction,
  type DiscipleshipActionResult,
} from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import type { DisciplerView, LeaderPrompt } from "@/lib/db/queries/sogp-discipleship";
import {
  DISCIPLESHIP_PROMPT_MAX_LENGTH,
  DISCIPLESHIP_REPLY_MAX_LENGTH,
  DISCIPLESHIP_RESPONSE_MAX_LENGTH,
  GENERIC_PROMPT_SUGGESTIONS,
} from "@/lib/sogp/discipleship";

export function formatDiscipleshipDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

/** Server action runner with pending/error state; the action revalidates the page. */
export function useDiscipleshipAction(preview: boolean) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<DiscipleshipActionResult>,
    onSuccess?: () => void,
    onError?: () => void,
  ) {
    setError(null);
    if (preview) {
      onSuccess?.();
      return;
    }
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onSuccess?.();
        return;
      }
      setError(result.error);
      onError?.();
    });
  }

  return { pending, error, run };
}

const textareaClass =
  "w-full rounded-sm border border-zinc-200 bg-white px-3 py-2 text-base leading-[1.5] text-zinc-900 placeholder:text-zinc-400 focus-visible:border-[var(--color-brand-blue)] focus-visible:outline-none sm:text-sm";
const primaryButtonClass =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-medium text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60";
const quietButtonClass =
  "text-xs font-medium text-[var(--color-brand-blue)] underline-offset-4 hover:underline";

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-xs text-red-700">
      {error}
    </p>
  ) : null;
}

function Spinner({ pending }: { pending: boolean }) {
  return pending ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" /> : null;
}

// ─── Discipler side ─────────────────────────────────────────────────────────

export function PromptComposer({
  preview,
  hasDisciples,
  suggestions = GENERIC_PROMPT_SUGGESTIONS,
  levelTitle = null,
}: {
  preview: boolean;
  hasDisciples: boolean;
  suggestions?: string[];
  levelTitle?: string | null;
}) {
  const [body, setBody] = useState("");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => createDiscipleshipPromptAction({ body }), () => setBody(""));
      }}
    >
      <label htmlFor="discipleship-prompt" className="text-[0.8125rem] font-medium text-zinc-900">
        Ask your group a check-in question
      </label>
      <textarea
        id="discipleship-prompt"
        rows={3}
        maxLength={DISCIPLESHIP_PROMPT_MAX_LENGTH}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="What did God teach you this week?"
        className={textareaClass}
      />
      {levelTitle ? (
        <p className="text-[0.7rem] text-zinc-500">
          Suggested from this week: <span className="font-medium text-zinc-700">{levelTitle}</span>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setBody(suggestion)}
            className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-left text-[0.7rem] text-zinc-600 hover:border-zinc-300"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <ErrorText error={error} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.7rem] text-zinc-400">
          {hasDisciples
            ? "Each disciple answers privately. Only you see their answers."
            : "Your disciples will see this once they join."}
        </p>
        <button type="submit" disabled={pending || !body.trim()} className={primaryButtonClass}>
          <Spinner pending={pending} /> Send
        </button>
      </div>
    </form>
  );
}

export function LeaderPromptList({
  prompts,
  discipleCount,
  preview,
}: {
  prompts: LeaderPrompt[];
  discipleCount: number;
  preview: boolean;
}) {
  if (prompts.length === 0) {
    return <p className="text-xs text-zinc-500">No check-ins yet. Your questions will appear here.</p>;
  }
  return (
    <ul className="grid gap-2">
      {prompts.map((prompt, index) => (
        <li key={prompt.id}>
          <details open={index === 0} className="group rounded-sm border border-zinc-200 bg-white">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-2.5">
              <span className="grid gap-0.5">
                <span className="text-sm font-medium text-zinc-900">{prompt.body}</span>
                <span className="text-[0.7rem] text-zinc-400">
                  Sent {formatDiscipleshipDate(prompt.createdAt)}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-semibold text-zinc-600">
                {prompt.responses.length} of {discipleCount} answered
              </span>
            </summary>
            <div className="grid gap-2 border-t border-zinc-100 px-3 py-3">
              {prompt.responses.length === 0 ? (
                <p className="text-xs text-zinc-500">No answers yet.</p>
              ) : (
                prompt.responses.map((response) => (
                  <LeaderResponse key={response.id} response={response} preview={preview} />
                ))
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function LeaderResponse({
  response,
  preview,
}: {
  response: LeaderPrompt["responses"][number];
  preview: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState(response.leaderReply ?? "");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <div className="grid gap-1.5 rounded-sm bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-900">
        {response.discipleFirstName}
        <span className="ml-2 font-normal text-zinc-400">
          {formatDiscipleshipDate(response.updatedAt)}
        </span>
      </p>
      <p className="whitespace-pre-wrap text-sm leading-[1.55] text-zinc-700">{response.body}</p>
      {response.leaderReply && !replying ? (
        <p className="border-l-2 border-[var(--color-brand-blue)] pl-2 text-xs leading-[1.5] text-zinc-600">
          <span className="font-medium text-zinc-900">You: </span>
          {response.leaderReply}
        </p>
      ) : null}
      {replying ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              () => replyToDiscipleshipAnswerAction({ responseId: response.id, reply }),
              () => setReplying(false),
            );
          }}
        >
          <textarea
            rows={2}
            maxLength={DISCIPLESHIP_REPLY_MAX_LENGTH}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            aria-label={`Reply to ${response.discipleFirstName}`}
            className={textareaClass}
          />
          <ErrorText error={error} />
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setReplying(false)} className={quietButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={pending || !reply.trim()} className={primaryButtonClass}>
              <Spinner pending={pending} /> Reply
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setReplying(true)} className={`${quietButtonClass} justify-self-start`}>
          {response.leaderReply ? "Edit reply" : "Reply"}
        </button>
      )}
    </div>
  );
}

// ─── Disciple side ──────────────────────────────────────────────────────────

export function DisciplePromptList({
  prompts,
  leaderFirstName,
  preview,
}: {
  prompts: DisciplerView["prompts"];
  leaderFirstName: string;
  preview: boolean;
}) {
  if (prompts.length === 0) {
    return (
      <p className="text-xs text-zinc-500">
        No check-ins yet. When {leaderFirstName} asks a question, it will appear here.
      </p>
    );
  }
  return (
    <ul className="grid gap-2">
      {prompts.map((prompt) => (
        <li key={prompt.id}>
          <DisciplePrompt prompt={prompt} leaderFirstName={leaderFirstName} preview={preview} />
        </li>
      ))}
    </ul>
  );
}

function DisciplePrompt({
  prompt,
  leaderFirstName,
  preview,
}: {
  prompt: DisciplerView["prompts"][number];
  leaderFirstName: string;
  preview: boolean;
}) {
  const [editing, setEditing] = useState(!prompt.response);
  const [body, setBody] = useState(prompt.response?.body ?? "");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <div className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-900">{prompt.body}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
            prompt.response ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {prompt.response ? "Answered" : "Waiting for you"}
        </span>
      </div>
      <p className="text-[0.7rem] text-zinc-400">
        From {leaderFirstName}, {formatDiscipleshipDate(prompt.createdAt)}
      </p>
      {editing ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              () => answerDiscipleshipPromptAction({ promptId: prompt.id, body }),
              () => setEditing(false),
            );
          }}
        >
          <textarea
            rows={3}
            maxLength={DISCIPLESHIP_RESPONSE_MAX_LENGTH}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            aria-label="Your answer"
            placeholder={`Only ${leaderFirstName} will see your answer.`}
            className={textareaClass}
          />
          <ErrorText error={error} />
          <div className="flex items-center justify-end gap-3">
            {prompt.response ? (
              <button type="button" onClick={() => setEditing(false)} className={quietButtonClass}>
                Cancel
              </button>
            ) : null}
            <button type="submit" disabled={pending || !body.trim()} className={primaryButtonClass}>
              <Spinner pending={pending} /> {prompt.response ? "Save" : "Send answer"}
            </button>
          </div>
        </form>
      ) : prompt.response ? (
        <>
          <p className="whitespace-pre-wrap rounded-sm bg-zinc-50 p-2.5 text-sm leading-[1.55] text-zinc-700">
            {prompt.response.body}
          </p>
          {prompt.response.leaderReply ? (
            <p className="border-l-2 border-[var(--color-brand-blue)] pl-2 text-xs leading-[1.5] text-zinc-600">
              <span className="font-medium text-zinc-900">{leaderFirstName}: </span>
              {prompt.response.leaderReply}
            </p>
          ) : null}
          <button type="button" onClick={() => setEditing(true)} className={`${quietButtonClass} justify-self-start`}>
            Edit answer
          </button>
        </>
      ) : null}
    </div>
  );
}
