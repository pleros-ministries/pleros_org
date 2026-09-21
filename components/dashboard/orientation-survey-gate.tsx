"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { SOGP_ORIENTATION_REASONS } from "../../lib/sogp/orientation-survey";

const REQUIRED_REASON_COUNT = 3;

export function OrientationSurveyGate({
  telegramUrl,
  initialCompleted,
}: {
  telegramUrl: string;
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [reasons, setReasons] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (completed) {
    return (
      <div className="grid min-w-0 justify-items-center gap-3 text-center">
        <p className="min-w-0 max-w-full font-[var(--font-be-vietnam-pro)] text-sm leading-[1.6] text-white/82 sm:max-w-[32rem]">
          Join your cohort community on Telegram for your orientation pack
          and the next steps to take.
        </p>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => router.push("/dashboard/pre-sogp")}
          className="site-button-text inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-center text-xs font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px sm:px-7 sm:text-sm"
        >
          Join the orientation group
        </a>
      </div>
    );
  }

  function toggleReason(value: string) {
    setReasons((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      if (current.length >= REQUIRED_REASON_COUNT) return current;
      return [...current, value];
    });
  }

  async function handleSubmit() {
    if (
      reasons.length !== REQUIRED_REASON_COUNT ||
      !question.trim() ||
      submitting
    )
      return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/sogp/orientation-survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasons, question }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not save your answers.");
      }
      setCompleted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save your answers.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-5 text-left">
      <div className="grid gap-2 text-center">
        <p className="font-[var(--font-be-vietnam-pro)] text-sm leading-[1.6] text-white/82">
          Before you join, choose your top {REQUIRED_REASON_COUNT} reasons
          for joining the School of God&rsquo;s Purpose.
        </p>
      </div>

      <fieldset className="grid gap-2.5">
        {SOGP_ORIENTATION_REASONS.map((reason) => {
          const checked = reasons.includes(reason.value);
          const disabled = !checked && reasons.length >= REQUIRED_REASON_COUNT;
          return (
            <label
              key={reason.value}
              className={`flex items-start gap-3 rounded-[var(--radius-md)] border bg-white/8 p-3.5 text-sm text-white transition-colors ${disabled ? "opacity-45" : "cursor-pointer hover:bg-white/12"
                }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggleReason(reason.value)}
                className="mt-0.5 size-4 shrink-0 "
              />
              <span className="font-[var(--font-be-vietnam-pro)] leading-[1.4]">
                {reason.label}
              </span>
            </label>
          );
        })}
      </fieldset>

      <label className="grid gap-2 text-sm text-white">
        <span className="font-[var(--font-be-vietnam-pro)] leading-[1.4] text-white/82">
          Kindly write out the most pressing questions you have that you
          would like us to privately and personally answer.
        </span>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="If no question you can write nill"
          className="w-full resize-y rounded-[var(--radius-md)] border border-white/18 bg-white/8 p-3.5 font-[var(--font-be-vietnam-pro)] text-sm leading-[1.6] text-white placeholder:text-white/50 outline-none focus-visible:border-white/50"
        />
      </label>

      {error ? (
        <p role="alert" className="text-center text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="grid justify-items-center gap-1">
        <button
          type="button"
          disabled={
            reasons.length !== REQUIRED_REASON_COUNT ||
            !question.trim() ||
            submitting
          }
          onClick={handleSubmit}
          className="site-button-text inline-flex min-h-12 max-w-full items-center justify-center gap-2 rounded-full bg-white px-7 text-center text-xs font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px disabled:opacity-45 sm:text-sm"
        >
          {submitting ? "Saving…" : "Continue to the orientation group"}
        </button>
        <span className="font-[var(--font-be-vietnam-pro)] text-xs text-white/60">
          {reasons.length} / {REQUIRED_REASON_COUNT} selected
        </span>
      </div>
    </div>
  );
}
