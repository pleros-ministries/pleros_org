"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";

type QuizPayload = {
  dayNumber: number;
  lessonTitle: string;
  bestScore: number | null;
  questions: Array<{
    id: number;
    questionType: "multiple_choice" | "short_text";
    questionText: string;
    options: string[] | null;
  }>;
};

async function getQuiz(dayNumber: number): Promise<QuizPayload> {
  const response = await fetch(`/api/sogp/course/day/${dayNumber}/quiz`);
  if (!response.ok) throw new Error("Quiz could not load");
  return response.json() as Promise<QuizPayload>;
}

export function SogpQuiz({ dayNumber }: { dayNumber: number }) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({ queryKey: ["sogp", "quiz", dayNumber], queryFn: () => getQuiz(dayNumber) });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const payload = (await response.json()) as { score?: number; passed?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Quiz could not be submitted");
      return payload as { score: number; passed: boolean };
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sogp", "quiz", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] }),
      ]);
    },
  });

  return (
    <section className="site-shell-page py-10">
      <Link href={`/dashboard/sogp/course/day/${dayNumber}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)]"><ArrowLeft className="size-3.5"/> Back to lesson</Link>
      <div className="mx-auto mt-8 grid max-w-3xl gap-6">
        <header className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Day {dayNumber} assessment</p><h1 className="font-[var(--font-sen)] text-4xl font-semibold tracking-[-0.06em] text-[var(--color-text-strong)]">{data.lessonTitle}</h1><p className="text-sm text-[var(--color-text-muted)]">Pass mark: 70%{data.bestScore === null ? "" : ` · Best score: ${data.bestScore}%`}</p></header>
        {mutation.data ? <div className={`grid justify-items-center gap-3 rounded-[var(--radius-md)] p-8 text-center ${mutation.data.passed ? "bg-[var(--color-brand-sky)]" : "bg-amber-50"}`}><CheckCircle2 className={`size-9 ${mutation.data.passed ? "text-emerald-600" : "text-amber-600"}`}/><h2 className="font-[var(--font-sen)] text-3xl font-semibold">{mutation.data.score}%</h2><p className="text-sm">{mutation.data.passed ? "Quiz passed. Keep going." : "Review the teaching and try again."}</p><button type="button" onClick={()=>{mutation.reset();setAnswers({});}} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-4 text-xs font-semibold"><RotateCcw className="size-3.5"/> Try again</button></div> : <form className="grid gap-4" onSubmit={(event)=>{event.preventDefault();mutation.mutate();}}>{data.questions.map((question,index)=><fieldset key={question.id} className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 md:p-6"><legend className="sr-only">Question {index+1}</legend><p className="font-[var(--font-sen)] text-lg font-semibold leading-[1.35] text-[var(--color-text-strong)]"><span className="mr-2 text-[var(--color-brand-blue)]">{index+1}.</span>{question.questionText}</p>{question.questionType === "multiple_choice" ? <div className="grid gap-2">{(question.options??[]).map((option)=><label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[0.6rem] border px-4 text-sm transition ${answers[String(question.id)]===option?"border-[var(--color-brand-blue)] bg-[var(--color-brand-sky)]":"border-[var(--color-line)] hover:bg-[var(--color-surface-muted)]"}`}><input type="radio" name={`question-${question.id}`} value={option} checked={answers[String(question.id)]===option} onChange={()=>setAnswers((current)=>({...current,[String(question.id)]:option}))}/><span>{option}</span></label>)}</div> : <textarea rows={4} className="rounded-[var(--radius-sm)] border border-[var(--color-line-strong)] p-3" value={answers[String(question.id)]??""} onChange={(event)=>setAnswers((current)=>({...current,[String(question.id)]:event.target.value}))}/>}</fieldset>)}{mutation.error?<p role="alert" className="text-sm text-red-700">{mutation.error.message}</p>:null}<button type="submit" disabled={mutation.isPending} className="min-h-12 rounded-full bg-[var(--color-brand-blue)] px-6 text-sm font-semibold text-white disabled:opacity-50">{mutation.isPending?"Submitting":"Submit quiz"}</button></form>}
      </div>
    </section>
  );
}
