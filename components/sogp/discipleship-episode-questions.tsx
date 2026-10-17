"use client";
import { useEffect, useState } from "react";
import { markEpisodeQuestionsReadAction, replyToEpisodeQuestionAction } from "@/app/(site)/dashboard/sogp/discipleship/_actions";
import type { LeaderEpisodeQuestion, OwnEpisodeQuestion } from "@/lib/db/queries/sogp-episode-questions";
import { useDiscipleshipAction } from "./discipleship-check-ins";
import { formatDiscipleshipDate } from "./discipleship-check-ins";

function ReplyForm({ questionId, existing, preview }: { questionId: number; existing: string | null; preview: boolean }) {
  const [reply, setReply] = useState(existing ?? "");
  const [open, setOpen] = useState(false);
  const action = useDiscipleshipAction(preview);
  return open ? <form onSubmit={event => { event.preventDefault(); action.run(() => replyToEpisodeQuestionAction({ questionId, reply }), () => setOpen(false)); }} className="grid gap-2">
    <label className="grid gap-1 text-[13px]"><span>Your reply</span><textarea rows={3} maxLength={2000} value={reply} disabled={action.pending} onChange={event => setReply(event.target.value)} className="min-h-9 rounded-[11px] border border-zinc-200 bg-white px-3 py-2 text-[14px]" /></label>
    {action.error ? <p role="alert" className="text-xs text-red-700">{action.error}</p> : null}
    <div className="flex gap-2"><button type="submit" disabled={action.pending || !reply.trim()} className="h-8 rounded-[10px] bg-(--color-brand-blue) px-3.5 text-[13px] font-medium text-white disabled:opacity-50">{action.pending ? "Sending…" : existing ? "Update reply" : "Send reply"}</button><button type="button" onClick={() => setOpen(false)} className="min-h-9 rounded-[11px] border border-zinc-200 px-4 text-[14px]">Cancel</button></div>
  </form> : <button type="button" onClick={() => setOpen(true)} className="min-h-9 text-left text-[13px] font-medium text-(--color-brand-blue)">{existing ? "Edit reply" : "Reply"}</button>;
}

/** Lead view: a disciple's episode questions with private replies. */
export function LeaderEpisodeQuestionList({ questions, preview }: { questions: LeaderEpisodeQuestion[]; preview: boolean }) {
  if (!questions.length) return null;
  return <div className="grid gap-3">{questions.map(question => <article key={question.id} className="grid gap-2 rounded-[12px] border border-zinc-200 bg-white p-3">
    <p className="text-[11px] font-medium tracking-[.04em] text-(--color-text-muted) uppercase">About · {question.episodeTitle}</p>
    <p className="text-[14px]">{question.body}</p>
    <p className="text-[12px] text-(--color-text-muted)">Asked {formatDiscipleshipDate(question.createdAt)}</p>
    {question.reply ? <div className="grid gap-1 border-t border-zinc-100 pt-2"><p className="text-[13px] font-medium">You:</p><p className="text-[14px]">{question.reply}</p></div> : null}
    <ReplyForm questionId={question.id} existing={question.reply} preview={preview} />
  </article>)}</div>;
}

/** Asker view: own questions with the discipler's replies. */
export function OwnEpisodeQuestionList({ questions, leaderFirstName, preview }: { questions: OwnEpisodeQuestion[]; leaderFirstName: string; preview: boolean }) {
  useEffect(() => {
    if (preview || !questions.some(question => question.askerUnread)) return;
    void markEpisodeQuestionsReadAction().catch(() => undefined);
  }, [preview, questions]);
  if (!questions.length) return null;
  return <div className="grid gap-3">{questions.map(question => <article key={question.id} className="grid gap-2 rounded-[12px] border border-zinc-200 bg-white p-3">
    <p className="text-[11px] font-medium tracking-[.04em] text-(--color-text-muted) uppercase">About · {question.episodeTitle}</p>
    <p className="text-[14px]">{question.body}</p>
    {question.reply ? <div className="grid gap-1 border-t border-zinc-100 pt-2"><p className="text-[13px] font-medium">{leaderFirstName} replied{question.askerUnread ? " · New" : ""}:</p><p className="text-[14px]">{question.reply}</p></div> : <p className="text-[12px] text-(--color-text-muted)">{leaderFirstName} has not replied yet.</p>}
  </article>)}</div>;
}
