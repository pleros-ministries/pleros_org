"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3 } from "lucide-react";

import lesson from "./sogp-lesson.module.css";

type ResponsePayload = {
  dayNumber: number;
  lessonTitle: string;
  prompt: string | null;
  submission: { content: string; status: "draft" | "submitted" | "approved" | "needs_revision"; reviewerNote: string | null } | null;
};

async function getResponse(dayNumber: number): Promise<ResponsePayload> {
  const response = await fetch(`/api/sogp/course/day/${dayNumber}/response`);
  if (!response.ok) throw new Error("Written response could not load");
  return response.json() as Promise<ResponsePayload>;
}

/** Shared with the lesson page, which prefetches it so the Response tab opens at once. */
export function sogpResponseQuery(dayNumber: number) {
  return { queryKey: ["sogp", "response", dayNumber] as const, queryFn: () => getResponse(dayNumber), staleTime: 5 * 60_000 };
}

/** `embedded` drops the page title so the response can sit in the lesson's Response tab. */
export function SogpWrittenResponse({ dayNumber, embedded = false }: { dayNumber: number; embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(sogpResponseQuery(dayNumber));
  const [content, setContent] = useState(data.submission?.content ?? "");
  const mutation = useMutation({
    mutationFn: async (action: "save" | "submit") => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/response`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, content }) });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Response could not be saved");
      return action;
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sogp", "response", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "journey"] }),
      ]);
    },
  });
  const locked = data.submission?.status === "submitted" || data.submission?.status === "approved";

  return (
    <section className={embedded ? lesson.stack : lesson.page}>
      {embedded ? null : <header className={lesson.header}>
        <h1>{data.lessonTitle}</h1>
        <p className={lesson.sub}>Day {dayNumber} written response</p>
      </header>}
      <section className={lesson.prompt} aria-label="Response prompt">
        <p className={lesson.meta}>Response prompt</p>
        {data.prompt ? (
          <div className="prose prose-sm max-w-none text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{ __html: data.prompt }} />
        ) : (
          <p className={lesson.promptFallback}>Reflect on what this teaching changes in your understanding and practice.</p>
        )}
      </section>
      {data.submission?.status === "approved" ? <div className={lesson.done}><CheckCircle2 className="size-5 shrink-0" aria-hidden /><span>Your response is approved.</span></div> : null}
      {data.submission?.status === "submitted" ? <div className={lesson.pending}><Clock3 className="size-5 shrink-0" aria-hidden /><span>Submitted · waiting for review</span></div> : null}
      {data.submission?.status === "draft" ? <p className={lesson.meta}>Draft saved. Submit it when you’re ready.</p> : null}
      {data.submission?.reviewerNote ? <div className={lesson.note}><b>Reviewer note</b><p>{data.submission.reviewerNote}</p></div> : null}
      <textarea value={content} onChange={(event) => setContent(event.target.value)} disabled={locked} rows={12} maxLength={20000} aria-label="Your written response" className={`${lesson.textarea} ${embedded ? lesson.textareaShort : ""}`} placeholder="Write your response here…" />
      {mutation.error ? <p role="alert" className={lesson.error}>{mutation.error.message}</p> : null}
      {!locked ? (
        <div className={lesson.actions}>
          <button type="button" disabled={mutation.isPending || !content.trim()} onClick={() => mutation.mutate("save")} className={lesson.secondary}>Save draft</button>
          <button type="button" disabled={mutation.isPending || !content.trim()} onClick={() => mutation.mutate("submit")} className={lesson.primary}>Submit for review</button>
        </div>
      ) : null}
    </section>
  );
}
