"use client";

import Link from "next/link";
import { useState } from "react";
import lesson from "./sogp-lesson.module.css";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  ExternalLink,
  FileText,
  HelpCircle,
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

function Curriculum({ data, compact = false }: { data: DayPayload; compact?: boolean }) {
  return (
    <nav aria-label="Course curriculum" className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
      {!compact ? <div className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-white px-4 py-4"><h2 className="font-[var(--font-sen)] text-sm font-semibold">Course curriculum</h2></div> : null}
      <div className="p-2">{[1,2,3,4].map((week)=><div key={week} className="border-b border-[var(--color-line)] py-3 last:border-0"><p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Week {week} of 4</p><div className="grid gap-1">{data.dashboard.tracks.filter((item)=>item.isRequired&&item.weekNumber===week).map((item)=>{const unlocked=item.accessible; const Icon=item.completed?Check:unlocked?Play:LockKeyhole; return <Link key={item.id} href={unlocked?`/dashboard/sogp/course/day/${item.dayNumber}`:"#"} aria-current={item.dayNumber===data.track.dayNumber?"page":undefined} className={`grid grid-cols-[1.4rem_1fr] gap-2 rounded-[0.45rem] px-2 py-2.5 text-xs leading-[1.35] ${item.dayNumber===data.track.dayNumber?"bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]":unlocked?"hover:bg-[var(--color-surface-muted)]":"pointer-events-none opacity-45"}`}><Icon className="mt-0.5 size-3.5"/><span>Day {item.dayNumber} · {item.lesson.title}</span></Link>;})}</div></div>)}</div>
    </nav>
  );
}

export function SogpDayView({ dayNumber }: { dayNumber: number }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "progress">("overview");
  const { data } = useSuspenseQuery({
    queryKey: ["sogp", "day", dayNumber],
    queryFn: () => fetchDay(dayNumber),
  });
  const notesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sogp/course/day/${dayNumber}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: "notes" }),
      });
      if (!response.ok) throw new Error("Notes progress could not be saved");
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sogp", "day", dayNumber] }),
        queryClient.invalidateQueries({ queryKey: ["sogp", "dashboard"] }),
      ]);
    },
  });
  const telegramUrl = data.dashboard.cohort.telegramDiscussionUrl ?? data.dashboard.cohort.telegramChannelUrl ?? (data.dashboard.cohort.telegramBotUsername ? `https://t.me/${data.dashboard.cohort.telegramBotUsername.replace(/^@/, "")}` : null);
  const signals = [
    ["Teaching listened", data.track.progress.audioListened],
    ["Notes read", data.track.progress.notesRead],
    ["Quiz passed", data.track.progress.quizPassed],
    ["Written response submitted", data.track.progress.writtenApproved],
  ] as const;

  const tracks = data.dashboard.tracks.filter((item) => item.isRequired);
  const position = tracks.findIndex((item) => item.dayNumber === data.track.dayNumber) + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <section className={lesson.page}>
      <header className={lesson.header}>
        <p className={lesson.eyebrow}>Week {data.track.weekNumber} · Track {pad(position || data.track.dayNumber)} of {tracks.length}</p>
        <h1>{data.track.lesson.title}</h1>
      </header>
      <article className={lesson.trackCard} aria-label="Lesson audio">
        <p className={lesson.eyebrow}>Traditional track</p>
        <h2>Track {pad(position || data.track.dayNumber)}</h2>
        <p className={lesson.meta}>{data.track.lesson.title} · 1 hr/day · Audio teaching</p>
        {data.track.lesson.audioUrl ? <SogpAudioPlayer key={dayNumber} dayNumber={dayNumber} src={data.track.lesson.audioUrl} listened={data.track.progress.audioListened}/> : <p className={lesson.notice}>Teaching audio is being prepared.</p>}
      </article>
      <div className={lesson.tabs} role="tablist">
        {(["overview", "progress"] as const).map((key) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{key === "overview" ? "Overview" : "Completion"}</button>)}
      </div>
      {tab === "overview" ? (data.track.lesson.notesContent ? <article className={lesson.notes}>
        <div className="prose prose-sm max-w-none leading-[1.7] text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{__html:data.track.lesson.notesContent}}/>
        <button type="button" className={lesson.secondary} disabled={data.track.progress.notesRead||notesMutation.isPending} onClick={()=>notesMutation.mutate()}>{data.track.progress.notesRead?"Notes marked as read":notesMutation.isPending?"Saving…":"Mark notes read"}<Check className="size-4"/></button>
      </article> : <p className={lesson.meta}>Lesson notes are not available for this track.</p>)
      : <ul className={lesson.signals}>{signals.map(([label,complete])=><li key={label}>{complete?<Check className="size-4 text-[var(--status-green-text)]"/>:<Circle className="size-4 text-[var(--color-line-strong)]"/>}<span>{label}</span></li>)}</ul>}
      <div className={lesson.rows}>
        <Link className={lesson.row} href={`/dashboard/sogp/course/day/${dayNumber}/quiz`}><HelpCircle className="size-5"/><span><strong>Your response & quiz</strong><span className={lesson.meta}>{data.bestQuizScore===null?"Quiz not attempted":`Best quiz score ${data.bestQuizScore}%`}</span></span><ArrowRight className="size-4"/></Link>
        <Link className={lesson.row} href={`/dashboard/sogp/course/day/${dayNumber}/response`}><FileText className="size-5"/><span><strong>Written response</strong><span className={lesson.meta}>{data.submission?.status.replaceAll("_"," ")??"Not started"}</span></span><ArrowRight className="size-4"/></Link>
        {telegramUrl?<a className={lesson.row} href={telegramUrl} target="_blank" rel="noreferrer"><MessageCircleMore className="size-5"/><span><strong>Ask your question</strong><span className={lesson.meta}>Text or voice note in Telegram</span></span><ExternalLink className="size-4"/></a>:null}
      </div>
      <details className={lesson.curriculum}><summary>All {tracks.length} tracks</summary><Curriculum data={data} compact /></details>
      <footer className={lesson.footer}>
        {data.nextDay?<Link className={lesson.primary} href={`/dashboard/sogp/course/day/${data.nextDay.dayNumber}`}>Continue after this lesson<ArrowRight className="size-4"/></Link>:<Link className={lesson.primary} href="/dashboard/sogp">Back to Learning<ArrowRight className="size-4"/></Link>}
        {data.previousDay?<Link className={lesson.textLink} href={`/dashboard/sogp/course/day/${data.previousDay.dayNumber}`}><ArrowLeft className="size-4"/> Previous track</Link>:null}
      </footer>
    </section>
  );
}
