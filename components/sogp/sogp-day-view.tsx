"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import lesson from "./sogp-lesson.module.css";
import { BrowserSuspense } from "./browser-suspense";
import { SogpQuiz } from "./sogp-quiz";
import { SogpWrittenResponse } from "./sogp-written-response";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ListOrdered,
  LockKeyhole,
  MessageCircleMore,
  Play,
} from "lucide-react";

import { SogpAudioPlayer } from "./sogp-audio-player";

type Track = {
  id: number;
  dayNumber: number;
  weekNumber: number;
  isRequired: boolean;
  liveSessionNumber: number | null;
  releaseAt: string;
  lesson: {
    id: number;
    title: string;
    audioUrl: string | null;
    notesContent: string | null;
    responsePrompt: string | null;
  };
  progress: {
    audioListened: boolean;
    notesRead: boolean;
    quizPassed: boolean;
    writtenApproved: boolean;
  };
  completed: boolean;
  accessible: boolean;
};

type DayPayload = {
  dashboard: {
    generatedAt?: string;
    cohort: {
      title: string;
      telegramDiscussionUrl: string | null;
      telegramChannelUrl: string | null;
      telegramBotUsername: string | null;
    };
    tracks: Track[];
  };
  track: Track;
  previousDay: Track | null;
  nextDay: Track | null;
  bestQuizScore: number | null;
  submission: { id: number; status: string; reviewerNote: string | null } | null;
  generatedAt: string;
};

async function fetchDay(dayNumber: number): Promise<DayPayload> {
  const response = await fetch(`/api/sogp/course/day/${dayNumber}`);
  if (!response.ok) throw new Error("SOGP day could not load");
  return response.json() as Promise<DayPayload>;
}

function Curriculum({ data }: { data: DayPayload }) {
  return (
    <nav aria-label="Course curriculum" className={lesson.panel}>
      {[1, 2, 3, 4].map((week) => {
        const items = data.dashboard.tracks.filter((item) => item.isRequired && item.weekNumber === week);
        if (!items.length) return null;
        return (
          <div key={week}>
            <p className={lesson.weekLabel}>Week {week} of 4</p>
            <ul className={lesson.list}>
              {items.map((item) => {
                const unlocked = item.accessible;
                const current = item.dayNumber === data.track.dayNumber;
                const Icon = item.completed ? Check : unlocked ? Play : LockKeyhole;
                return (
                  <li key={item.id}>
                    <Link
                      href={unlocked ? `/dashboard/sogp/course/day/${item.dayNumber}` : "#"}
                      aria-current={current ? "page" : undefined}
                      aria-disabled={unlocked ? undefined : true}
                      tabIndex={unlocked ? undefined : -1}
                      className={`${lesson.row} ${lesson.trackRow}`}
                    >
                      <span className={`${lesson.chip} ${lesson.chipSmall}`} data-tint={item.completed || current ? undefined : "neutral"}><Icon className="size-3.5" aria-hidden /></span>
                      <span className={lesson.rowCopy}><span className={lesson.rowTitle}>Day {item.dayNumber} · {item.lesson.title}</span></span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function StepMark({ done = false, small = false }: { done?: boolean; small?: boolean }) {
  return <span className={lesson.stepMark} data-done={done || undefined} data-small={small || undefined} aria-label={done ? "Done" : "To do"}><Check className="size-3" strokeWidth={3} aria-hidden /></span>;
}

/** Ask about this lesson: to the active discipler (the same private thread as
    podcast episode questions), else Ask Pleros (user, 18 October). */
function LessonQuestion({ lessonId, lessonTitle }: { lessonId: number; lessonTitle: string }) {
  const [route, setRoute] = useState<"discipler" | "ask" | null>(null);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSend] = useTransition();
  const episodeGuid = `sogp-lesson-${lessonId}`;
  useEffect(() => {
    let live = true;
    import("@/app/(site)/dashboard/sogp/discipleship/_actions")
      .then(({ getEpisodeQuestionRouteAction }) => getEpisodeQuestionRouteAction())
      .then(result => { if (live) setRoute(result.kind === "discipler" ? "discipler" : "ask"); }, () => { if (live) setRoute("ask"); });
    return () => { live = false; };
  }, []);
  function send() {
    if (!body.trim()) { setError("Write your question first."); return; }
    startSend(async () => {
      try {
        const { askEpisodeQuestionAction } = await import("@/app/(site)/dashboard/sogp/discipleship/_actions");
        const result = await askEpisodeQuestionAction({ episodeGuid, episodeTitle: lessonTitle, body: body.trim() });
        if (!result.ok) { setError(result.error); return; }
        setBody(""); setOpen(false); setSent(true); setError(null);
      } catch { setError("Your question could not be sent. Try again."); }
    });
  }
  const chip = <span className={lesson.quietIcon}><MessageCircleMore className="size-4" aria-hidden/></span>;
  if (route === "ask") {
    const params = new URLSearchParams({ episodeGuid, episodeTitle: lessonTitle });
    return <Link className={lesson.quietRow} href={`/dashboard/community/ask?${params.toString()}`}>{chip}<span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask a question</span><span className={lesson.rowMeta}>Goes to Pleros through Ask Pleros</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link>;
  }
  return <div>
    <button type="button" className={lesson.quietRow} disabled={!route} aria-expanded={open} onClick={() => { setOpen(value => !value); setSent(false); }}>{chip}<span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask your discipler</span><span className={lesson.rowMeta}>{sent ? "Sent. Their reply shows in your group." : "Only you and your discipler see it"}</span></span><ChevronDown className={`size-4 ${lesson.rowEnd}`} style={{ transform: open ? "rotate(180deg)" : undefined }} aria-hidden/></button>
    {open ? <div className={lesson.askBody}>
      <label className={lesson.askLabel}>Your question<textarea className={lesson.textarea} rows={4} maxLength={2000} value={body} disabled={saving} onChange={event => setBody(event.target.value)} placeholder="What would you like to ask about this lesson?" /></label>
      {error ? <p role="alert" className={lesson.error}>{error}</p> : null}
      <button type="button" className={lesson.primary} disabled={saving} onClick={send}>{saving ? "Sending…" : "Send to my discipler"}</button>
    </div> : null}
  </div>;
}

type LessonTab = "notes" | "quiz" | "response";
const LESSON_TABS: LessonTab[] = ["notes", "quiz", "response"];

export function SogpDayView({ dayNumber }: { dayNumber: number }) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as LessonTab | null;
  const [tab, setTab] = useState<LessonTab>(requestedTab && LESSON_TABS.includes(requestedTab) ? requestedTab : "notes");
  // Keep the tab in the address so a shared or reloaded link reopens it.
  function chooseTab(next: LessonTab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }
  const { data } = useSuspenseQuery({
    queryKey: ["sogp", "day", dayNumber],
    queryFn: () => fetchDay(dayNumber),
  });
  const notesMutation = useMutation({
    mutationFn: async (done: boolean = true) => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: "notes", done }),
      });
      if (!response.ok) throw new Error("Notes progress could not be saved");
    },
    onMutate: async (done: boolean = true) => {
      await queryClient.cancelQueries({ queryKey: ["sogp", "day", dayNumber] });
      const previous = queryClient.getQueryData<DayPayload>(["sogp", "day", dayNumber]);
      if (previous) queryClient.setQueryData<DayPayload>(["sogp", "day", dayNumber], { ...previous, track: { ...previous.track, progress: { ...previous.track.progress, notesRead: done } } });
      return { previous };
    },
    onError: (_error, _done, context) => {
      if (context?.previous) queryClient.setQueryData(["sogp", "day", dayNumber], context.previous);
    },
    onSuccess() {
      // Refresh in the background so the toggle frees up at once.
      void queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] });
      void queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] });
    },
  });
  const listenedMutation = useMutation({
    mutationFn: async (done: boolean) => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: "audio", done }),
      });
      if (!response.ok) throw new Error("Listening progress could not be saved");
    },
    onMutate: async (done: boolean = true) => {
      await queryClient.cancelQueries({ queryKey: ["sogp", "day", dayNumber] });
      const previous = queryClient.getQueryData<DayPayload>(["sogp", "day", dayNumber]);
      if (previous) queryClient.setQueryData<DayPayload>(["sogp", "day", dayNumber], { ...previous, track: { ...previous.track, progress: { ...previous.track.progress, audioListened: done } } });
      return { previous };
    },
    onError: (_error, _done, context) => {
      if (context?.previous) queryClient.setQueryData(["sogp", "day", dayNumber], context.previous);
    },
    onSuccess() {
      // Refresh in the background so the toggle frees up at once.
      void queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] });
      void queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] });
    },
  });
  const listened = data.track.progress.audioListened;
  const steps = [
    { key: "listen", label: "Listen", short: "listening", done: listened },
    { key: "notes", label: "Notes", short: "notes", done: data.track.progress.notesRead },
    { key: "quiz", label: "Quiz", short: "quiz", done: data.track.progress.quizPassed },
    { key: "response", label: "Response", short: "response", done: data.track.progress.writtenApproved },
  ];
  const doneSteps = steps.filter(step => step.done).length;

  const tracks = data.dashboard.tracks.filter((item) => item.isRequired);
  const position = tracks.findIndex((item) => item.dayNumber === data.track.dayNumber) + 1;
  return (
    <section className={lesson.page}>
      <header className={lesson.header}>
        <h1>{data.track.lesson.title}</h1>
        <p className={lesson.sub}>Week {data.track.weekNumber} · Track {position || data.track.dayNumber} of {tracks.length} · Traditional, 1 hr/day</p>
      </header>
      {/* Option B (user, 18 October): a four-step strip, the player with its own
          listened tick, then Notes, Quiz and Response as tabs that carry theirs. */}
      <div className={lesson.strip} aria-label={`${doneSteps} of 4 steps done`}>
        <div className={lesson.stripBars}>{steps.map(step => <i key={step.key} data-done={step.done || undefined} />)}</div>
        <p className={lesson.meta}>{doneSteps === 4 ? "All four steps done" : `${doneSteps} of 4 steps · ${steps.filter(step => !step.done).map(step => step.short).join(", ")} left`}</p>
      </div>
      <div className={lesson.playerWrap}>
        <button type="button" className={lesson.listenToggle} aria-pressed={listened} disabled={listenedMutation.isPending} onClick={() => listenedMutation.mutate(!listened)}>{listened ? <><Check className="size-3.5" aria-hidden /> Listened</> : "Mark listened"}</button>
        {data.track.lesson.audioUrl ? <SogpAudioPlayer key={dayNumber} dayNumber={dayNumber} src={data.track.lesson.audioUrl} listened={listened}/> : <p className={lesson.notice}>Teaching audio is being prepared.</p>}
      </div>
      <div className={lesson.lessonTabs} role="tablist" aria-label="Lesson sections">
        {steps.slice(1).map(step => <button key={step.key} type="button" role="tab" id={`tab-${step.key}`} aria-controls={`panel-${step.key}`} aria-selected={tab === step.key} onClick={() => chooseTab(step.key as LessonTab)}>{step.label}<StepMark done={step.done} small /></button>)}
      </div>
      <div className={lesson.tabPanel} role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "notes" ? <>
          {data.track.lesson.notesContent ? <div className="prose prose-sm max-w-none leading-[1.7] text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{__html:data.track.lesson.notesContent}}/> : <p className={lesson.empty}>Notes for this track are not available yet.</p>}
          <button type="button" className={lesson.secondary} aria-pressed={data.track.progress.notesRead} disabled={notesMutation.isPending} onClick={()=>notesMutation.mutate(!data.track.progress.notesRead)}>{data.track.progress.notesRead ? <><Check className="size-4" aria-hidden/> Read · tap to unmark</> : <>Mark notes read<Check className="size-4" aria-hidden/></>}</button>
        </> : tab === "quiz" ? <BrowserSuspense fallback={<p className={lesson.meta}>Loading the quiz…</p>}><SogpQuiz dayNumber={dayNumber} embedded /></BrowserSuspense>
        : <BrowserSuspense fallback={<p className={lesson.meta}>Loading your response…</p>}><SogpWrittenResponse dayNumber={dayNumber} embedded /></BrowserSuspense>}
      </div>
      <footer className={lesson.footer}>
        {data.nextDay?<Link className={lesson.primary} href={`/dashboard/sogp/course/day/${data.nextDay.dayNumber}`}>Continue to track {(position || data.track.dayNumber) + 1}<ArrowRight className="size-4" aria-hidden/></Link>:<Link className={lesson.primary} href="/dashboard/sogp">Back to Learning<ArrowRight className="size-4" aria-hidden/></Link>}
        {data.previousDay?<Link className={lesson.textLink} href={`/dashboard/sogp/course/day/${data.previousDay.dayNumber}`}><ArrowLeft className="size-4" aria-hidden/> Previous track</Link>:null}
      </footer>
      {/* Secondary tools sit apart from the lesson's own steps (user, 18 October). */}
      <section className={lesson.more} aria-label="More for this lesson">
        <LessonQuestion lessonId={data.track.lesson.id} lessonTitle={data.track.lesson.title} />
        <details className={lesson.curriculum}><summary><span className={lesson.quietIcon}><ListOrdered className="size-4" aria-hidden/></span>All {tracks.length} tracks<ChevronDown className="size-4" aria-hidden/></summary><Curriculum data={data} /></details>
      </section>
    </section>
  );
}
