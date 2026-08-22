"use client";

import Link from "next/link";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
  const now = new Date(data.generatedAt).getTime();
  return (
    <nav aria-label="Course curriculum" className="hidden max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white lg:block">
      <div className="sticky top-0 z-10 border-b border-[var(--color-line)] bg-white px-4 py-4"><h2 className="font-[var(--font-sen)] text-sm font-semibold">Course curriculum</h2></div>
      <div className="p-2">{[1,2,3,4].map((week)=><div key={week} className="border-b border-[var(--color-line)] py-3 last:border-0"><p className="px-2 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Week {week} of 4</p><div className="grid gap-1">{data.dashboard.tracks.filter((item)=>item.weekNumber===week).map((item)=>{const unlocked=new Date(item.releaseAt).getTime()<=now; const Icon=item.completed?Check:unlocked?Play:LockKeyhole; return <Link key={item.id} href={unlocked?`/dashboard/sogp/course/day/${item.dayNumber}`:"#"} aria-current={item.dayNumber===data.track.dayNumber?"page":undefined} className={`grid grid-cols-[1.4rem_1fr] gap-2 rounded-[0.45rem] px-2 py-2.5 text-xs leading-[1.35] ${item.dayNumber===data.track.dayNumber?"bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]":unlocked?"hover:bg-[var(--color-surface-muted)]":"pointer-events-none opacity-45"}`}><Icon className="mt-0.5 size-3.5"/><span>Day {item.dayNumber} · {item.lesson.title}</span></Link>;})}</div></div>)}</div>
    </nav>
  );
}

export function SogpDayView({ dayNumber }: { dayNumber: number }) {
  const queryClient = useQueryClient();
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
    ["Written response approved", data.track.progress.writtenApproved],
  ] as const;

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface)] pb-20">
      <header className="border-b border-[var(--color-line)] bg-white">
        <div className="site-shell-page grid gap-4 py-7">
          <Link href="/dashboard/sogp" className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)]"><ArrowLeft className="size-3.5"/> SOGP dashboard</Link>
          <div className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Day {data.track.dayNumber} · Week {data.track.weekNumber}</p><h1 className="font-[var(--font-sen)] text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[0.95] tracking-[-0.06em] text-[var(--color-text-strong)]">{data.track.lesson.title}</h1></div>
        </div>
      </header>
      <div className="site-shell-page grid gap-5 py-8 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <Curriculum data={data}/>
        <main className="grid content-start gap-5">
          {data.track.lesson.audioUrl ? <SogpAudioPlayer dayNumber={dayNumber} src={data.track.lesson.audioUrl} listened={data.track.progress.audioListened}/> : <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Teaching audio is being prepared.</div>}
          {data.track.lesson.notesContent ? <article className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 md:p-8"><div className="mb-6 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BookOpen className="size-5 text-[var(--color-brand-blue)]"/><h2 className="font-[var(--font-sen)] text-xl font-semibold">Lesson notes</h2></div>{data.track.progress.notesRead?<span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check className="size-3.5"/> Read</span>:null}</div><div className="prose prose-sm max-w-none font-[var(--font-be-vietnam-pro)] leading-[1.7] text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{__html:data.track.lesson.notesContent}}/><button type="button" disabled={data.track.progress.notesRead||notesMutation.isPending} onClick={()=>notesMutation.mutate()} className="mt-8 min-h-11 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white disabled:opacity-50">{data.track.progress.notesRead?"Notes marked as read":notesMutation.isPending?"Saving":"Mark notes read"}</button></article>:null}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-5">{data.previousDay?<Link href={`/dashboard/sogp/course/day/${data.previousDay.dayNumber}`} className="inline-flex min-h-10 items-center gap-1 rounded-full border border-[var(--color-line-strong)] px-4 text-xs font-semibold"><ArrowLeft className="size-3.5"/> Day {data.previousDay.dayNumber}</Link>:<span/>}{data.nextDay?<Link href={`/dashboard/sogp/course/day/${data.nextDay.dayNumber}`} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white">Day {data.nextDay.dayNumber}<ArrowRight className="size-3.5"/></Link>:null}</div>
        </main>
        <aside className="grid content-start gap-4">
          <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5"><h2 className="font-[var(--font-sen)] text-lg font-semibold">Lesson completion</h2><div className="mt-5 grid gap-4">{signals.map(([label,complete])=><div key={label} className="grid grid-cols-[1.25rem_1fr] items-center gap-2">{complete?<span className="grid size-5 place-items-center rounded-full bg-[var(--color-brand-lime)]"><Check className="size-3 text-[var(--color-brand-blue)]"/></span>:<Circle className="size-5 text-[var(--color-line-strong)]"/>}<span className="text-xs font-medium text-[var(--color-text-strong)]">{label}</span></div>)}</div></section>
          <section className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-3"><Link href={`/dashboard/sogp/course/day/${dayNumber}/quiz`} className="flex min-h-14 items-center gap-3 rounded-[0.5rem] p-2 hover:bg-[var(--color-brand-sky)]"><HelpCircle className="size-4 text-[var(--color-brand-blue)]"/><div className="grid gap-0.5"><span className="text-xs font-semibold">Quiz</span><span className="text-[0.65rem] text-[var(--color-text-muted)]">{data.bestQuizScore===null?"Not attempted":`Best score ${data.bestQuizScore}%`}</span></div></Link><Link href={`/dashboard/sogp/course/day/${dayNumber}/response`} className="flex min-h-14 items-center gap-3 rounded-[0.5rem] p-2 hover:bg-[var(--color-brand-sky)]"><FileText className="size-4 text-[var(--color-brand-blue)]"/><div className="grid gap-0.5"><span className="text-xs font-semibold">Written response</span><span className="text-[0.65rem] text-[var(--color-text-muted)]">{data.submission?.status.replaceAll("_"," ")??"Not started"}</span></div></Link></section>
          {telegramUrl?<a href={telegramUrl} target="_blank" rel="noreferrer" className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-5 text-white"><MessageCircleMore className="size-6 text-[var(--color-brand-lime)]"/><div className="grid gap-1"><span className="font-[var(--font-sen)] text-lg font-semibold">Ask your question</span><span className="text-xs leading-[1.45] text-white/75">Use text or voice note in Telegram.</span></div><span className="inline-flex items-center gap-1 text-xs font-semibold">Open Telegram <ExternalLink className="size-3.5"/></span></a>:null}
        </aside>
      </div>
    </section>
  );
}
