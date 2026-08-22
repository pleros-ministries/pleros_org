"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

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

export function SogpWrittenResponse({ dayNumber }: { dayNumber: number }) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({ queryKey: ["sogp", "response", dayNumber], queryFn: () => getResponse(dayNumber) });
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
      ]);
    },
  });
  const locked = data.submission?.status === "submitted" || data.submission?.status === "approved";

  return (
    <section className="site-shell-page sogp-shell-page py-10">
      <Link href={`/dashboard/sogp/course/day/${dayNumber}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]"><ArrowLeft className="size-3.5"/> Back to lesson</Link>
      <div className="mx-auto mt-8 grid max-w-3xl gap-6">
        <header className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Day {dayNumber} written response</p><h1 className="font-[var(--font-sen)] text-4xl font-semibold tracking-[-0.06em] text-[var(--color-text-strong)]">{data.lessonTitle}</h1></header>
        <section className="rounded-[var(--radius-md)] bg-[var(--color-brand-sky)] p-5 md:p-6"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Response prompt</p><p className="mt-3 font-[var(--font-sen)] text-xl font-semibold leading-[1.4] text-[var(--color-text-strong)]">{data.prompt??"Reflect on what this teaching changes in your understanding and practice."}</p></section>
        {data.submission?.status === "approved" ? <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"><CheckCircle2 className="size-5"/><span className="text-sm font-semibold">Your response is approved.</span></div>:null}
        {data.submission?.reviewerNote ? <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">Reviewer note</p><p className="mt-2 text-sm leading-[1.55] text-amber-950">{data.submission.reviewerNote}</p></div>:null}
        <textarea value={content} onChange={(event)=>setContent(event.target.value)} disabled={locked} rows={14} maxLength={20000} className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-line-strong)] bg-white p-5 font-[var(--font-be-vietnam-pro)] text-sm leading-[1.7] outline-none focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] disabled:bg-[var(--color-surface-muted)]" placeholder="Write your response here…"/>
        {mutation.error?<p role="alert" className="text-sm text-red-700">{mutation.error.message}</p>:null}
        {!locked?<div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={mutation.isPending||!content.trim()} onClick={()=>mutation.mutate("save")} className="min-h-11 rounded-full border border-[var(--color-line-strong)] bg-white px-5 text-sm font-semibold disabled:opacity-50">Save draft</button><button type="button" disabled={mutation.isPending||!content.trim()} onClick={()=>mutation.mutate("submit")} className="min-h-11 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white disabled:opacity-50">Submit for review</button></div>:null}
      </div>
    </section>
  );
}
