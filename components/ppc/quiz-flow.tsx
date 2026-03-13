"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trophy, X, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { MCQuestion, ShortTextQuestion } from "@/components/ppc/quiz-question";
import { submitQuiz } from "@/app/ppc/_actions/quiz-actions";

type Question = {
  id: number;
  questionType: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  sortOrder: number;
};

type QuizFlowProps = {
  userId: string;
  lessonId: number;
  questions: Question[];
  bestScore: number | null;
};

type QuizResult = {
  score: number;
  passed: boolean;
  attemptNumber: number;
};

export function QuizFlow({ userId, lessonId, questions, bestScore }: QuizFlowProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
  const current = sorted[currentIndex];
  const isLast = currentIndex === sorted.length - 1;

  const setAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: value }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitQuiz(userId, lessonId, answers);
      setResult(res);
      router.refresh();
    });
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  };

  if (result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        {result.passed ? (
          <Trophy className="size-10 text-emerald-500" />
        ) : (
          <X className="size-10 text-red-500" />
        )}
        <div className="space-y-1">
          <p className="text-lg font-semibold text-zinc-900">
            {result.passed ? "Quiz passed!" : "Quiz not passed"}
          </p>
          <p className="text-sm text-zinc-500">
            Score: {result.score}% (attempt #{result.attemptNumber})
          </p>
          {bestScore !== null && (
            <p className="text-xs text-zinc-400">
              Best score: {Math.max(bestScore, result.score)}%
            </p>
          )}
        </div>
        {!result.passed && (
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Retry quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {sorted.map((q, i) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
              i === currentIndex
                ? "bg-zinc-900 text-white"
                : answers[String(q.id)]
                  ? "bg-zinc-200 text-zinc-700"
                  : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {bestScore !== null && (
        <p className="text-xs text-zinc-400">Best score so far: {bestScore}%</p>
      )}

      <div>
        {current.questionType === "multiple_choice" && current.options ? (
          <MCQuestion
            questionNumber={currentIndex + 1}
            questionText={current.questionText}
            options={current.options}
            selectedAnswer={answers[String(current.id)]}
            onSelect={(val) => setAnswer(current.id, val)}
          />
        ) : (
          <ShortTextQuestion
            questionNumber={currentIndex + 1}
            questionText={current.questionText}
            value={answers[String(current.id)] ?? ""}
            onChange={(val) => setAnswer(current.id, val)}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors",
            currentIndex === 0
              ? "cursor-not-allowed opacity-40"
              : "hover:bg-zinc-50",
          )}
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800",
              isPending && "opacity-50",
            )}
          >
            <Send className="size-3.5" />
            {isPending ? "Submitting…" : "Submit"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Next
            <ChevronRight className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
