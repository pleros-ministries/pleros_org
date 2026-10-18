"use client";

import Link from "next/link";
import { useState } from "react";
import lesson from "./sogp-lesson.module.css";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
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
  return (
    <section className={lesson.page}>
      <header className={lesson.header}>
        <h1>{data.track.lesson.title}</h1>
        <p className={lesson.sub}>Week {data.track.weekNumber} · Track {position || data.track.dayNumber} of {tracks.length}</p>
      </header>
      <article className={lesson.card} aria-label="Lesson audio">
        <div className={lesson.cardHead}>
          <p className={lesson.meta}>1 hr/day · Audio teaching</p>
          {data.track.progress.audioListened ? <span className={lesson.pill}><Check className="size-3" aria-hidden /> Listened</span> : null}
        </div>
        {data.track.lesson.audioUrl ? <SogpAudioPlayer key={dayNumber} dayNumber={dayNumber} src={data.track.lesson.audioUrl} listened={data.track.progress.audioListened}/> : <p className={lesson.notice}>Teaching audio is being prepared.</p>}
      </article>
      <div className={lesson.tabs} role="tablist" aria-label="Lesson sections">
        {(["overview", "progress"] as const).map((key) => <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{key === "overview" ? "Overview" : "Completion"}</button>)}
      </div>
      {tab === "overview" ? (data.track.lesson.notesContent ? <article className={`${lesson.panel} ${lesson.notes}`}>
        <div className="prose prose-sm max-w-none leading-[1.7] text-[var(--color-text-strong)]" dangerouslySetInnerHTML={{__html:data.track.lesson.notesContent}}/>
        <button type="button" className={lesson.secondary} disabled={data.track.progress.notesRead||notesMutation.isPending} onClick={()=>notesMutation.mutate()}>{data.track.progress.notesRead?"Notes marked as read":notesMutation.isPending?"Saving…":"Mark notes read"}<Check className="size-4" aria-hidden/></button>
      </article> : <p className={lesson.empty}>Lesson notes are not available for this track.</p>)
      : <ul className={`${lesson.panel} ${lesson.list}`}>{signals.map(([label,complete])=><li key={label} className={lesson.row}><span className={`${lesson.chip} ${lesson.chipSmall}`} data-tint={complete?undefined:"neutral"}>{complete?<Check className="size-3.5" aria-hidden/>:<Circle className="size-3.5" aria-hidden/>}</span><span className={lesson.rowCopy}><span className={lesson.rowTitle}>{label}</span></span><span className={lesson.pill} data-tone={complete?undefined:"neutral"}>{complete?"Done":"To do"}</span></li>)}</ul>}
      <ul className={`${lesson.panel} ${lesson.list}`}>
        <li><Link className={lesson.row} href={`/dashboard/sogp/course/day/${dayNumber}/quiz`}><span className={lesson.chip}><HelpCircle className="size-[18px]" aria-hidden/></span><span className={lesson.rowCopy}><span className={lesson.rowTitle}>Your response & quiz</span><span className={lesson.rowMeta}>{data.bestQuizScore===null?"Quiz not attempted":`Best quiz score ${data.bestQuizScore}%`}</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link></li>
        <li><Link className={lesson.row} href={`/dashboard/sogp/course/day/${dayNumber}/response`}><span className={lesson.chip} data-tint="sky"><FileText className="size-[18px]" aria-hidden/></span><span className={lesson.rowCopy}><span className={lesson.rowTitle}>Written response</span><span className={lesson.rowMeta}>{data.submission ? sentence(data.submission.status) : "Not started"}</span></span><ArrowRight className={`size-4 ${lesson.rowEnd}`} aria-hidden/></Link></li>
        {telegramUrl?<li><a className={lesson.row} href={telegramUrl} target="_blank" rel="noreferrer"><span className={lesson.chip} data-tint="amber"><MessageCircleMore className="size-[18px]" aria-hidden/></span><span className={lesson.rowCopy}><span className={lesson.rowTitle}>Ask your question</span><span className={lesson.rowMeta}>Text or voice note in Telegram</span></span><ExternalLink className={`size-4 ${lesson.rowEnd}`} aria-hidden/></a></li>:null}
      </ul>
      <details className={lesson.curriculum}><summary>All {tracks.length} tracks<ChevronDown className="size-4" aria-hidden/></summary><Curriculum data={data} /></details>
      <footer className={lesson.footer}>
        {data.nextDay?<Link className={lesson.primary} href={`/dashboard/sogp/course/day/${data.nextDay.dayNumber}`}>Continue after this lesson<ArrowRight className="size-4" aria-hidden/></Link>:<Link className={lesson.primary} href="/dashboard/sogp">Back to Learning<ArrowRight className="size-4" aria-hidden/></Link>}
        {data.previousDay?<Link className={lesson.textLink} href={`/dashboard/sogp/course/day/${data.previousDay.dayNumber}`}><ArrowLeft className="size-4" aria-hidden/> Previous track</Link>:null}
      </footer>
    </section>
  );
}
