"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { ArrowRight, Check, CheckCircle2, RotateCcw } from "lucide-react";

import { LessonAudioControls } from "@/components/media/lesson-audio-controls";
import type { NextLesson } from "@/lib/db/queries/next-learning";

import { useAskAfterTeaching, type QuestionRoute } from "../ask-after-teaching";
import lesson from "../sogp-lesson.module.css";

/**
 * A teaching chosen after SOGP (Pastor, 21 October): listen, notes and a quiz,
 * laid out like an SOGP lesson. Every tick shows at once and rolls back with a
 * message if it doesn't save. "Do you have a question?" follows the teaching,
 * as on every other one. `preview` never saves.
 */

type Tab = "notes" | "quiz";
const FAILED = "Couldn’t save that. Check your connection and try again.";

function StepMark({ done }: { done: boolean }) {
  return <span className={lesson.stepMark} data-done={done || undefined} data-small aria-label={done ? "Done" : "To do"}><Check className="size-3" strokeWidth={3} aria-hidden /></span>;
}

const actions = () => import("@/app/(site)/dashboard/sogp/next/_actions");

export function NextLessonView({ data, preview }: { data: NextLesson; preview?: QuestionRoute }) {
  const [progress, setProgress] = useState(data.progress);
  const [tab, setTab] = useState<Tab>("notes");
  const [error, setError] = useState<string | null>(null);
  const ask = useAskAfterTeaching(preview);
  const teaching = { guid: `ppc-lesson-${data.id}`, title: data.title };
  const heard = useRef(data.progress.audioListened);

  const mark = (step: "audio" | "notes", done: boolean) => {
    const key = step === "audio" ? "audioListened" : "notesRead";
    setError(null);
    setProgress(current => ({ ...current, [key]: done }));
    if (step === "audio" && done) ask.prompt(teaching);
    if (preview) return;
    void actions().then(({ markNextLessonStepAction }) => markNextLessonStepAction(data.id, step, done))
      .catch(() => ({ ok: false as const, error: FAILED }))
      .then(result => { if (!result.ok) { setProgress(current => ({ ...current, [key]: !done })); setError(result.error); } });
  };

  const steps = [
    { key: "listen", label: "Listen", done: progress.audioListened },
    { key: "notes", label: "Notes", done: progress.notesRead },
    { key: "quiz", label: "Quiz", done: progress.quizPassed },
  ];
  const left = steps.filter(step => !step.done);
  const notesText = (data.notesContent ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  return <section className={lesson.page}>
    <header className={lesson.header}>
      <h1>{data.title}</h1>
      <p className={lesson.sub}>Your next learning · Listen, notes and a quiz</p>
    </header>
    <div className={lesson.strip} aria-label={`${3 - left.length} of 3 steps done`}>
      <div className={lesson.stripBars} style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>{steps.map(step => <i key={step.key} data-done={step.done || undefined} />)}</div>
      <p className={lesson.meta}>{left.length ? `${3 - left.length} of 3 steps · ${left.map(step => step.label.toLowerCase()).join(", ")} left` : "All three steps done"}</p>
    </div>
    {error ? <p role="alert" className={lesson.error}>{error}</p> : null}
    <div className={lesson.playerWrap}>
      <button type="button" className={lesson.listenToggle} aria-pressed={progress.audioListened} onClick={() => mark("audio", !progress.audioListened)}>{progress.audioListened ? <><Check className="size-3.5" aria-hidden /> Listened</> : "Mark listened"}</button>
      {data.audioUrl ? <div className="min-w-0 rounded-[12px] bg-[var(--color-brand-sky-soft)] p-3 min-[360px]:p-3.5 sm:p-4">
        <LessonAudioControls src={data.audioUrl} onProgress={(seconds, duration) => {
          // 90% through counts as listened, once.
          if (!heard.current && Number.isFinite(duration) && duration > 0 && seconds / duration >= 0.9) { heard.current = true; mark("audio", true); }
        }} />
      </div> : <p className={lesson.notice}>Teaching audio is being prepared.</p>}
    </div>
    <div className={lesson.lessonTabs} role="tablist" aria-label="Teaching sections">
      {steps.slice(1).map(step => <button key={step.key} type="button" role="tab" id={`tab-${step.key}`} aria-controls={`panel-${step.key}`} aria-selected={tab === step.key} onClick={() => setTab(step.key as Tab)}>{step.label}<StepMark done={step.done} /></button>)}
    </div>
    <div className={lesson.tabPanel} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === "notes" ? <>
        {notesText.length < 90 ? <p className={lesson.notesPlaceholder}>{notesText || "Notes for this teaching are not available yet."}</p> : <div className="prose prose-sm max-w-none leading-[1.7] text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{ __html: data.notesContent! }} />}
        <button type="button" className={lesson.secondary} aria-pressed={progress.notesRead} onClick={() => mark("notes", !progress.notesRead)}>{progress.notesRead ? <><Check className="size-4" aria-hidden /> Read · tap to unmark</> : <>Mark notes read<Check className="size-4" aria-hidden /></>}</button>
      </> : <Quiz data={data} passed={progress.quizPassed} preview={Boolean(preview)} onPassed={() => setProgress(current => ({ ...current, quizPassed: true }))} />}
    </div>
    <footer className={lesson.footer}>
      <Link className={lesson.footerBack} href="/dashboard/sogp">Back to Learning<ArrowRight className="size-4" aria-hidden /></Link>
    </footer>
    {ask.ui}
  </section>;
}

function Quiz({ data, passed, preview, onPassed }: { data: NextLesson; passed: boolean; preview: boolean; onPassed: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [best, setBest] = useState(data.bestScore);
  const [retaking, setRetaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    if (preview) { setResult({ score: 80, passed: true }); return; }
    startTransition(async () => {
      const outcome = await actions().then(({ submitNextLessonQuizAction }) => submitNextLessonQuizAction(data.id, answers)).catch(() => ({ ok: false as const, error: FAILED }));
      if (!outcome.ok) { setError(outcome.error); return; }
      setResult({ score: outcome.score, passed: outcome.passed });
      setBest(current => Math.max(current ?? 0, outcome.score));
      if (outcome.passed) onPassed();
    });
  };

  if (!data.questions.length) return <p className={lesson.notesPlaceholder}>The quiz for this teaching isn’t ready yet.</p>;
  if (passed && !result && !retaking) return <div className={lesson.done}>
    <CheckCircle2 className="size-5 shrink-0" aria-hidden />
    <span className="flex-1">Passed{best != null ? ` with ${best}%` : ""}</span>
    <button type="button" className={lesson.doneAction} onClick={() => setRetaking(true)}><RotateCcw className="size-3.5" aria-hidden /> Retake</button>
  </div>;
  if (result) return <div className={`${lesson.panel} ${lesson.result}`} role="status">
    <span className={lesson.chip} data-tint={result.passed ? undefined : "amber"}><CheckCircle2 className="size-5" aria-hidden /></span>
    <strong>{result.score}%</strong>
    <p>{result.passed ? "Quiz passed. Well done." : "Review the teaching and try again."}</p>
    <button type="button" className={lesson.secondary} onClick={() => { setResult(null); setAnswers({}); setRetaking(true); }}><RotateCcw className="size-3.5" aria-hidden /> {result.passed ? "Retake" : "Try again"}</button>
  </div>;
  return <form className={lesson.stack} onSubmit={event => { event.preventDefault(); submit(); }}>
    <p className={lesson.meta}>Pass mark 70%{best == null ? "" : ` · Best score ${best}%`}</p>
    {data.questions.map((question, index) => <fieldset key={question.id} className={lesson.question}>
      <legend className="sr-only">Question {index + 1}</legend>
      <p className={lesson.questionText}><span>{index + 1}.</span><span>{question.questionText}</span></p>
      {question.questionType === "multiple_choice" ? <div className={lesson.options}>
        {(question.options ?? []).map(option => <label key={option} className={lesson.option}>
          <input type="radio" name={`question-${question.id}`} value={option} checked={answers[String(question.id)] === option} onChange={() => setAnswers(current => ({ ...current, [String(question.id)]: option }))} />
          <span>{option}</span>
        </label>)}
      </div> : <textarea rows={4} aria-label={`Answer to question ${index + 1}`} className={lesson.textarea} value={answers[String(question.id)] ?? ""} onChange={event => setAnswers(current => ({ ...current, [String(question.id)]: event.target.value }))} />}
    </fieldset>)}
    {error ? <p role="alert" className={lesson.error}>{error}</p> : null}
    <button type="submit" disabled={pending} className={lesson.primary}>{pending ? "Submitting…" : "Submit quiz"}</button>
  </form>;
}
