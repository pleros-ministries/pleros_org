"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import lesson from "./sogp-lesson.module.css";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
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

function sentence(value: string) {
  const text = value.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function StepMark({ done = false }: { done?: boolean }) {
  return <span className={lesson.stepMark} data-done={done || undefined} aria-label={done ? "Done" : "To do"}><Check className="size-3" strokeWidth={3} aria-hidden /></span>;
}

/** A step the learner marks themselves: the whole row toggles it. */
function ToggleStep({ title, done, pending, failed, doneMeta, todoMeta, onToggle }: { title: string; done: boolean; pending: boolean; failed: boolean; doneMeta: string; todoMeta: string; onToggle: () => void }) {
  return <button type="button" role="checkbox" aria-checked={done} className={lesson.row} disabled={pending} onClick={onToggle}><StepMark done={done} /><span className={lesson.rowCopy}><span className={lesson.rowTitle}>{title}</span><span className={lesson.rowMeta}>{failed ? "Could not save. Tap to try again." : done ? doneMeta : todoMeta}</span></span></button>;
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
  const chip = <span className={lesson.chip} data-tint="amber"><MessageCircleMore className="size-[18px]" aria-hidden/></span>;
  if (route === "ask") {
    const params = new URLSearchParams({ episodeGuid, episodeTitle: lessonTitle });
    return <Link className={`${lesson.panel} ${lesson.row}`} href={`/dashboard/community/ask?${params.toString()}`}>{chip}<span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask a question</span><span className={lesson.rowMeta}>Goes to Pleros through Ask Pleros</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link>;
  }
  return <div className={lesson.panel}>
    <button type="button" className={lesson.row} disabled={!route} aria-expanded={open} onClick={() => { setOpen(value => !value); setSent(false); }}>{chip}<span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask your discipler</span><span className={lesson.rowMeta}>{sent ? "Sent. Their reply shows in your group." : "Only you and your discipler see it"}</span></span><ChevronDown className={`size-4 ${lesson.rowEnd}`} style={{ transform: open ? "rotate(180deg)" : undefined }} aria-hidden/></button>
    {open ? <div className={lesson.askBody}>
      <label className={lesson.askLabel}>Your question<textarea className={lesson.textarea} rows={4} maxLength={2000} value={body} disabled={saving} onChange={event => setBody(event.target.value)} placeholder="What would you like to ask about this lesson?" /></label>
      {error ? <p role="alert" className={lesson.error}>{error}</p> : null}
      <button type="button" className={lesson.primary} disabled={saving} onClick={send}>{saving ? "Sending…" : "Send to my discipler"}</button>
    </div> : null}
  </div>;
}

export function SogpDayView({ dayNumber }: { dayNumber: number }) {
  const queryClient = useQueryClient();
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
  const doneSteps = [listened, data.track.progress.notesRead, data.track.progress.quizPassed, data.track.progress.writtenApproved].filter(Boolean).length;

  const tracks = data.dashboard.tracks.filter((item) => item.isRequired);
  const position = tracks.findIndex((item) => item.dayNumber === data.track.dayNumber) + 1;
  return (
    <section className={lesson.page}>
      <header className={lesson.header}>
        <h1>{data.track.lesson.title}</h1>
        <p className={lesson.sub}>Week {data.track.weekNumber} · Track {position || data.track.dayNumber} of {tracks.length} · Traditional, 1 hr/day</p>
      </header>
      {/* The player is the one tinted panel; no white card around it (user, 18 October). */}
      {data.track.lesson.audioUrl ? <SogpAudioPlayer key={dayNumber} dayNumber={dayNumber} src={data.track.lesson.audioUrl} listened={data.track.progress.audioListened}/> : <p className={lesson.notice}>Teaching audio is being prepared.</p>}
      {/* One checklist: each step shows its state and its action in the same row
          (user, 18 October: a separate Completion list duplicated the actions). */}
      <section className={lesson.steps} aria-labelledby="lesson-steps">
        <div className={lesson.stepsHead}><h2 id="lesson-steps">Your steps</h2><span>{doneSteps} of 4 done</span></div>
        <ol className={`${lesson.panel} ${lesson.list}`}>
          <li><ToggleStep title="Listen to the teaching" done={listened} pending={listenedMutation.isPending} failed={listenedMutation.isError} doneMeta="Listened · tap to unmark" todoMeta="Tap to mark as listened" onToggle={() => listenedMutation.mutate(!listened)} /></li>
          <li>{data.track.lesson.notesContent
            ? <div className={lesson.row}><button type="button" role="checkbox" aria-checked={data.track.progress.notesRead} aria-label={data.track.progress.notesRead ? "Unmark notes as read" : "Mark notes as read"} className={lesson.markButton} disabled={notesMutation.isPending} onClick={() => notesMutation.mutate(!data.track.progress.notesRead)}><StepMark done={data.track.progress.notesRead} /></button><a className={lesson.rowLink} href="#lesson-notes"><span className={lesson.rowCopy}><span className={lesson.rowTitle}>Read the notes</span><span className={lesson.rowMeta}>{notesMutation.isError ? "Could not save. Try again." : data.track.progress.notesRead ? "Read · open the notes below" : "Open the notes below"}</span></span><ArrowDown className={`size-4 ${lesson.rowEnd}`} aria-hidden/></a></div>
            : <ToggleStep title="Read the notes" done={data.track.progress.notesRead} pending={notesMutation.isPending} failed={notesMutation.isError} doneMeta="Read · tap to unmark" todoMeta="No notes for this track yet · tap to mark" onToggle={() => notesMutation.mutate(!data.track.progress.notesRead)} />}</li>
          <li><Link className={lesson.row} href={`/dashboard/sogp/course/day/${dayNumber}/quiz`}><StepMark done={data.track.progress.quizPassed} /><span className={lesson.rowCopy}><span className={lesson.rowTitle}>Pass the quiz</span><span className={lesson.rowMeta}>{data.bestQuizScore===null?"Not attempted":`Best score ${data.bestQuizScore}%`}</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link></li>
          <li><Link className={lesson.row} href={`/dashboard/sogp/course/day/${dayNumber}/response`}><StepMark done={data.track.progress.writtenApproved} /><span className={lesson.rowCopy}><span className={lesson.rowTitle}>Write your response</span><span className={lesson.rowMeta}>{data.submission ? sentence(data.submission.status) : "Not started"}</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link></li>
        </ol>
      </section>
      <LessonQuestion lessonId={data.track.lesson.id} lessonTitle={data.track.lesson.title} />
      {data.track.lesson.notesContent ? <article id="lesson-notes" className={`${lesson.panel} ${lesson.notes}`} aria-labelledby="lesson-notes-title">
        <h2 id="lesson-notes-title" className={lesson.notesTitle}>Notes</h2>
        <div className="prose prose-sm max-w-none leading-[1.7] text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{__html:data.track.lesson.notesContent}}/>
        {data.track.progress.notesRead ? null : <button type="button" className={lesson.secondary} disabled={notesMutation.isPending} onClick={()=>notesMutation.mutate(true)}>Mark notes read<Check className="size-4" aria-hidden/></button>}
      </article> : null}
      <details className={lesson.curriculum}><summary>All {tracks.length} tracks<ChevronDown className="size-4" aria-hidden/></summary><Curriculum data={data} /></details>
      <footer className={lesson.footer}>
        {data.nextDay?<Link className={lesson.primary} href={`/dashboard/sogp/course/day/${data.nextDay.dayNumber}`}>Continue after this lesson<ArrowRight className="size-4" aria-hidden/></Link>:<Link className={lesson.primary} href="/dashboard/sogp">Back to Learning<ArrowRight className="size-4" aria-hidden/></Link>}
        {data.previousDay?<Link className={lesson.textLink} href={`/dashboard/sogp/course/day/${data.previousDay.dayNumber}`}><ArrowLeft className="size-4" aria-hidden/> Previous track</Link>:null}
      </footer>
    </section>
  );
}
