"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw } from "lucide-react";

import { ShareLearningProgressDialog } from "./share-learning-progress-dialog";
import lesson from "./sogp-lesson.module.css";

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

/** `embedded` drops the page title so the quiz can sit in the lesson's Quiz tab. */
export function SogpQuiz({ dayNumber, embedded = false }: { dayNumber: number; embedded?: boolean }) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({ queryKey: ["sogp", "quiz", dayNumber], queryFn: () => getQuiz(dayNumber) });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [shareOpen, setShareOpen] = useState(false);
  const wasAlreadyPassed = useRef(data.bestScore !== null && data.bestScore >= 70);
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/quiz`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers }) });
      const payload = (await response.json()) as { score?: number; passed?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Quiz could not be submitted");
      return payload as { score: number; passed: boolean };
    },
    async onSuccess(payload) {
      if (payload.passed && !wasAlreadyPassed.current) setShareOpen(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sogp", "quiz", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "journey"] }),
      ]);
    },
  });

  const result = mutation.data;
  return (
    <section className={embedded ? lesson.stack : lesson.page}>
      {embedded ? <p className={lesson.meta}>Pass mark 70%{data.bestScore === null ? "" : ` · Best score ${data.bestScore}%`}</p> : <header className={lesson.header}>
        <h1>{data.lessonTitle}</h1>
        <p className={lesson.sub}>Day {dayNumber} quiz · Pass mark 70%{data.bestScore === null ? "" : ` · Best score ${data.bestScore}%`}</p>
      </header>}
      {result ? (
        <div className={`${lesson.panel} ${lesson.result}`} role="status">
          <span className={lesson.chip} data-tint={result.passed ? undefined : "amber"}><CheckCircle2 className="size-5" aria-hidden /></span>
          <strong>{result.score}%</strong>
          <p>{result.passed ? "Quiz passed. Keep going." : "Review the teaching and try again."}</p>
          <button type="button" className={lesson.secondary} onClick={() => { mutation.reset(); setAnswers({}); }}><RotateCcw className="size-3.5" aria-hidden /> Try again</button>
        </div>
      ) : (
        <form className={lesson.stack} onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
          {data.questions.map((question, index) => (
            <fieldset key={question.id} className={lesson.question}>
              <legend className="sr-only">Question {index + 1}</legend>
              <p className={lesson.questionText}><span>{index + 1}.</span><span>{question.questionText}</span></p>
              {question.questionType === "multiple_choice" ? (
                <div className={lesson.options}>
                  {(question.options ?? []).map((option) => (
                    <label key={option} className={lesson.option}>
                      <input type="radio" name={`question-${question.id}`} value={option} checked={answers[String(question.id)] === option} onChange={() => setAnswers((current) => ({ ...current, [String(question.id)]: option }))} />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea rows={4} aria-label={`Answer to question ${index + 1}`} className={lesson.textarea} value={answers[String(question.id)] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [String(question.id)]: event.target.value }))} />
              )}
            </fieldset>
          ))}
          {mutation.error ? <p role="alert" className={lesson.error}>{mutation.error.message}</p> : null}
          <button type="submit" disabled={mutation.isPending} className={lesson.primary}>{mutation.isPending ? "Submitting…" : "Submit quiz"}</button>
        </form>
      )}
      <ShareLearningProgressDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        track="sogp"
        dayNumber={dayNumber}
      />
    </section>
  );
}
