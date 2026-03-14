"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

type MCQuestionProps = {
  questionNumber: number;
  questionText: string;
  options: string[];
  selectedAnswer?: string;
  onSelect: (answer: string) => void;
  disabled?: boolean;
  correctAnswer?: string;
  showResult?: boolean;
};

export function MCQuestion({
  questionNumber,
  questionText,
  options,
  selectedAnswer,
  onSelect,
  disabled,
  correctAnswer,
  showResult,
}: MCQuestionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-900">
        <span className="text-zinc-400 mr-1">Q{questionNumber}.</span>
        {questionText}
      </p>
      <div className="grid gap-2">
        {options.map((opt) => {
          const isSelected = selectedAnswer === opt;
          const isCorrect = showResult && opt === correctAnswer;
          const isWrong = showResult && isSelected && opt !== correctAnswer;

          return (
            <button
              key={opt}
              type="button"
              onClick={() => !disabled && onSelect(opt)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 rounded-sm border px-3 py-2 text-left text-sm transition-colors",
                isCorrect
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : isWrong
                    ? "border-red-300 bg-red-50 text-red-800"
                    : isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                disabled && !showResult && "cursor-not-allowed opacity-60",
              )}
            >
              <span className="flex-1">{opt}</span>
              {isCorrect && <CheckCircle2 className="size-4 shrink-0" />}
              {isWrong && <XCircle className="size-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ShortTextQuestionProps = {
  questionNumber: number;
  questionText: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ShortTextQuestion({
  questionNumber,
  questionText,
  value,
  onChange,
  disabled,
}: ShortTextQuestionProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-900">
        <span className="text-zinc-400 mr-1">Q{questionNumber}.</span>
        {questionText}
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        placeholder="Type your answer..."
        className={cn(
          "w-full resize-y rounded-sm border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-colors",
          disabled && "cursor-not-allowed bg-zinc-50",
        )}
      />
    </div>
  );
}
