"use client";

import { useState } from "react";

import {
  createPrayerRequestAction,
  deletePrayerRequestAction,
  markAnsweredAction,
  markPrayedAction,
} from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import type { DiscipleshipPrayerRequest } from "@/lib/db/queries/sogp-discipleship";
import { DISCIPLESHIP_PRAYER_MAX_LENGTH } from "@/lib/sogp/discipleship";

import { formatDiscipleshipDate, useDiscipleshipAction } from "./discipleship-check-ins";

const textareaClass =
  "w-full rounded-sm border border-zinc-200 bg-white px-3 py-2 text-base leading-[1.5] text-zinc-900 placeholder:text-zinc-400 focus-visible:border-[var(--color-brand-blue)] focus-visible:outline-none sm:text-sm";
const primaryButtonClass =
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-blue)] px-3.5 text-xs font-medium text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60";
const quietButtonClass =
  "text-xs font-medium text-[var(--color-brand-blue)] underline-offset-4 hover:underline disabled:opacity-60";

function ErrorText({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="text-xs text-red-700">
      {error}
    </p>
  ) : null;
}

function Testimony({ request }: { request: DiscipleshipPrayerRequest }) {
  if (request.status !== "answered") return null;
  return (
    <p className="border-l-2 border-emerald-500 pl-2 text-xs leading-[1.5] text-zinc-700">
      <span className="font-medium text-emerald-700">
        Answered{request.answeredAt ? ` ${formatDiscipleshipDate(request.answeredAt)}` : ""}
      </span>
      {request.answerNote ? `: ${request.answerNote}` : ""}
    </p>
  );
}

// ─── Discipler side ─────────────────────────────────────────────────────────

export function LeaderPrayerList({
  requests,
  preview,
}: {
  requests: DiscipleshipPrayerRequest[];
  preview: boolean;
}) {
  if (requests.length === 0) {
    return (
      <p className="text-xs text-zinc-500">
        No prayer requests yet. Your disciples can share them privately with you.
      </p>
    );
  }
  return (
    <ul className="grid gap-2">
      {requests.map((request) => (
        <LeaderPrayerItem key={request.id} request={request} preview={preview} />
      ))}
    </ul>
  );
}

function LeaderPrayerItem({
  request,
  preview,
}: {
  request: DiscipleshipPrayerRequest;
  preview: boolean;
}) {
  const [prayedAt, setPrayedAt] = useState(request.prayedAt);
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <li className="grid gap-1.5 rounded-sm border border-zinc-200 bg-white p-3">
      <p className="text-xs font-semibold text-zinc-900">
        {request.discipleFirstName}
        <span className="ml-2 font-normal text-zinc-400">
          {formatDiscipleshipDate(request.createdAt)}
        </span>
      </p>
      <p className="whitespace-pre-wrap text-sm leading-[1.55] text-zinc-700">{request.body}</p>
      <Testimony request={request} />
      <ErrorText error={error} />
      {prayedAt ? (
        <p className="text-[0.7rem] font-medium text-emerald-700">
          You prayed on {formatDiscipleshipDate(prayedAt)}
        </p>
      ) : request.status === "open" ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => markPrayedAction({ requestId: request.id }),
              () => setPrayedAt(new Date().toISOString()),
            )
          }
          className={`${primaryButtonClass} justify-self-start`}
        >
          I prayed for this
        </button>
      ) : null}
    </li>
  );
}

// ─── Disciple side ──────────────────────────────────────────────────────────

export function DisciplePrayerSection({
  requests,
  leaderFirstName,
  preview,
}: {
  requests: DiscipleshipPrayerRequest[];
  leaderFirstName: string;
  preview: boolean;
}) {
  const [body, setBody] = useState("");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <div className="grid gap-2 border-t border-zinc-100 pt-3">
      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => createPrayerRequestAction({ body }), () => setBody(""));
        }}
      >
        <label htmlFor="prayer-request" className="text-[0.8125rem] font-medium text-zinc-900">
          Share a prayer request with {leaderFirstName}
        </label>
        <textarea
          id="prayer-request"
          rows={2}
          maxLength={DISCIPLESHIP_PRAYER_MAX_LENGTH}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={`Only ${leaderFirstName} will see this.`}
          className={textareaClass}
        />
        <ErrorText error={error} />
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className={`${primaryButtonClass} justify-self-end`}
        >
          Share request
        </button>
      </form>
      {requests.length > 0 ? (
        <ul className="grid gap-2">
          {requests.map((request) => (
            <DisciplePrayerItem
              key={request.id}
              request={request}
              leaderFirstName={leaderFirstName}
              preview={preview}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DisciplePrayerItem({
  request,
  leaderFirstName,
  preview,
}: {
  request: DiscipleshipPrayerRequest;
  leaderFirstName: string;
  preview: boolean;
}) {
  const [answering, setAnswering] = useState(false);
  const [note, setNote] = useState("");
  const { pending, error, run } = useDiscipleshipAction(preview);

  return (
    <li className="grid gap-1.5 rounded-sm border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap text-sm leading-[1.55] text-zinc-700">{request.body}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
            request.status === "answered"
              ? "bg-emerald-50 text-emerald-700"
              : request.prayedAt
                ? "bg-sky-50 text-[var(--color-brand-blue)]"
                : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {request.status === "answered"
            ? "Answered"
            : request.prayedAt
              ? `${leaderFirstName} prayed`
              : "Open"}
        </span>
      </div>
      <p className="text-[0.7rem] text-zinc-400">Shared {formatDiscipleshipDate(request.createdAt)}</p>
      <Testimony request={request} />
      {answering ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(
              () => markAnsweredAction({ requestId: request.id, answerNote: note }),
              () => setAnswering(false),
            );
          }}
        >
          <textarea
            rows={2}
            maxLength={DISCIPLESHIP_PRAYER_MAX_LENGTH}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Share how God answered (optional)"
            aria-label="Testimony"
            className={textareaClass}
          />
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => setAnswering(false)} className={quietButtonClass}>
              Cancel
            </button>
            <button type="submit" disabled={pending} className={primaryButtonClass}>
              Mark answered
            </button>
          </div>
        </form>
      ) : null}
      <ErrorText error={error} />
      {!answering ? (
        <div className="flex items-center gap-4">
          {request.status === "open" ? (
            <button type="button" onClick={() => setAnswering(true)} className={quietButtonClass}>
              It was answered
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Delete this prayer request?")) {
                run(() => deletePrayerRequestAction({ requestId: request.id }));
              }
            }}
            className="text-xs font-medium text-zinc-500 underline-offset-4 hover:text-red-700 hover:underline disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      ) : null}
    </li>
  );
}
