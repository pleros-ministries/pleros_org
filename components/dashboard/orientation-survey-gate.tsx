"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { OrientationSurveyView, REQUIRED_ORIENTATION_REASONS as REQUIRED_REASON_COUNT } from "./shared/orientation-survey";

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

  return <OrientationSurveyView completed={completed} reasons={reasons} question={question} submitting={submitting} error={error} telegramUrl={telegramUrl} onToggle={toggleReason} onQuestionChange={setQuestion} onSubmit={handleSubmit} onContinue={() => router.push("/dashboard/welcomepack/setup")} />;
}
