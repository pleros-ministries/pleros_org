"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  ExternalLink,
  LockKeyhole,
  MessageCircleMore,
  Play,
  Radio,
  Sunrise,
} from "lucide-react";

import {
  calculateSogpEligibility,
  summarizeSogpTrackCompletion,
} from "@/lib/sogp/assessment";
import { partitionSogpPreparationDays } from "@/lib/sogp/preparation";
import type { SogpPreparationDay } from "@/lib/sogp/types";

import { SharePreparationDay } from "./share-preparation-day";

type DashboardPayload = {
  generatedAt: string;
  enrollment: {
    id: number;
    name: string;
    status: "enrolled" | "preparing" | "active" | "carryover" | "completed" | "withdrawn";
    telegramLinkedAt: string | null;
  };
  cohort: {
    id: number;
    title: string;
    status: "draft" | "enrollment_open" | "preparing" | "active" | "completed" | "archived";
    startsAt: string;
    endsAt: string;
    telegramChannelUrl: string | null;
    telegramDiscussionUrl: string | null;
    telegramBotUsername: string | null;
    assessmentPolicy: {
      requiredTrackCompletionPercent: number;
      requiredPrayerWatchPercent: number;
      requiredLiveClassCount: number;
    };
  };
  learnerState: "preparing" | "active" | "carryover" | "completed" | "withdrawn";
  tracks: Array<{
    id: number;
    dayNumber: number | null;
    weekNumber: number;
    curriculumLevel: number;
    curriculumOrder: number;
    isRequired: boolean;
    liveSessionNumber: number | null;
    releaseAt: string;
    lesson: { id: number; title: string; status: "draft" | "published" };
    completed: boolean;
  }>;
  liveClasses: Array<{
    id: number;
    title: string;
    startsAt: string;
    endsAt: string;
    youtubeLiveUrl: string | null;
    recordingUrl: string | null;
    status: "scheduled" | "live" | "completed" | "cancelled";
  }>;
  prayerDaysAttended: number;
  liveClassesAttended: number;
  certificate: { verificationCode: string; issuedAt: string; revokedAt: string | null } | null;
  preparationDays: SogpPreparationDay[];
};

async function fetchDashboard(): Promise<DashboardPayload> {
  const response = await fetch("/api/sogp/dashboard", { credentials: "same-origin" });
  if (!response.ok) throw new Error("SOGP dashboard request failed");
  return response.json() as Promise<DashboardPayload>;
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function CurriculumRail({ data }: { data: DashboardPayload }) {
  const now = new Date(data.generatedAt).getTime();
  return (
    <aside className="hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white lg:block">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-4">
        <BookOpen className="size-4 text-[var(--color-brand-blue)]" />
        <h2 className="font-[var(--font-sen)] text-sm font-semibold text-[var(--color-text-strong)]">Curriculum</h2>
      </div>
      <div className="max-h-[42rem] overflow-y-auto p-2">
        {[1, 2, 3, 4].map((week) => {
          const tracks = data.tracks.filter(
            (track) => track.isRequired && track.weekNumber === week && track.dayNumber !== null,
          );
          return (
            <div key={week} className="border-b border-[var(--color-line)] py-3 last:border-0">
              <p className="px-2 pb-2 font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Week {week}</p>
              <div className="grid gap-1">
                {tracks.length ? tracks.map((track) => {
                  const unlocked = new Date(track.releaseAt).getTime() <= now;
                  const Icon = track.completed ? Check : unlocked ? Play : LockKeyhole;
                  return (
                    <Link key={track.id} href={unlocked ? `/dashboard/sogp/course/day/${track.dayNumber}` : "#"} aria-disabled={!unlocked} className={`grid grid-cols-[1.5rem_1fr] items-start gap-2 rounded-[0.45rem] px-2 py-2.5 transition-colors ${unlocked ? "hover:bg-[var(--color-brand-sky)]" : "pointer-events-none opacity-48"}`}>
                      <Icon className="mt-0.5 size-3.5 text-[var(--color-brand-blue)]" />
                      <span className="font-[var(--font-be-vietnam-pro)] text-xs leading-[1.35] text-[var(--color-text-strong)]">Day {track.dayNumber} · {track.lesson.title}</span>
                    </Link>
                  );
                }) : <p className="px-2 py-2 font-[var(--font-be-vietnam-pro)] text-xs text-[var(--color-text-muted)]">Tracks being prepared</p>}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function PreparingDashboard({ data }: { data: DashboardPayload }) {
  const startsAt = new Date(data.cohort.startsAt);
  const days = Math.max(
    0,
    Math.ceil(
      (startsAt.getTime() - new Date(data.generatedAt).getTime()) / 86_400_000,
    ),
  );
  const preparation = partitionSogpPreparationDays(
    data.preparationDays,
    new Date(data.generatedAt),
  );

  function resourceLink(
    resource: SogpPreparationDay["resources"][number],
  ) {
    const external = resource.url.startsWith("https://");
    const content = (
      <>
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-blue)]">{resource.type}</span>
        <span className="font-[var(--font-sen)] text-lg font-semibold leading-[1.08] tracking-[-0.04em] text-[var(--color-text-strong)]">{resource.title}</span>
        {resource.description ? <span className="text-xs leading-[1.5] text-[var(--color-text-muted)]">{resource.description}</span> : null}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-blue)]">Open resource <ArrowRight className="size-3.5" /></span>
      </>
    );
    const className = "group grid min-h-40 content-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 transition-transform duration-150 hover:-translate-y-px";
    return external ? (
      <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className={className}>{content}</a>
    ) : (
      <Link key={resource.id} href={resource.url} className={className}>{content}</Link>
    );
  }

  return (
    <div className="grid gap-5">
      <section className="grid min-h-64 content-between overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-6 text-white md:p-8">
        <div className="flex items-center gap-2 font-[var(--font-be-vietnam-pro)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-lime)]"><Clock3 className="size-4" /> Preparation phase</div>
        <div className="grid gap-4">
          <h2 className="font-[var(--font-sen)] text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.06em]">{days > 0 ? `${days} days until your cohort begins` : "Your cohort is about to begin"}</h2>
          <p className="max-w-[36rem] font-[var(--font-be-vietnam-pro)] text-sm leading-[1.55] text-white/78">Use this preparation window to explore Pleros, connect with the community, and build a steady learning rhythm.</p>
        </div>
      </section>
      {preparation.today ? (
        <section className="grid gap-4">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Today’s preparation</p>
            <h2 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">{preparation.today.countdownLabel}</h2>
            <p className="max-w-[44rem] text-sm leading-[1.6] text-[var(--color-text-muted)]">{preparation.today.introduction}</p>
            <SharePreparationDay
              dateKey={preparation.today.publishDate}
              dayLabel={preparation.today.countdownLabel}
              title={
                preparation.today.resources.find(
                  (resource) =>
                    resource.type === "video" || resource.type === "teaching",
                )?.title ?? preparation.today.countdownLabel
              }
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">{preparation.today.resources.map(resourceLink)}</div>
        </section>
      ) : (
        <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Today’s preparation</p>
          <h2 className="mt-3 font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">Your material for today is being prepared</h2>
          <p className="mt-2 text-sm leading-[1.55] text-[var(--color-text-muted)]">Check back shortly. You can still revisit every previously published preparation day below.</p>
        </section>
      )}

      {preparation.previous.length ? (
        <section className="grid gap-3">
          <h2 className="font-[var(--font-sen)] text-xl font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">Previous preparation days</h2>
          <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            {preparation.previous.map((day) => (
              <details key={day.id} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-[var(--color-text-strong)] [&::-webkit-details-marker]:hidden">
                  <span>{day.countdownLabel}</span>
                  <span className="text-xs font-normal text-[var(--color-text-muted)]">{day.publishDate}</span>
                </summary>
                <div className="mt-4 grid gap-3">
                  <p className="text-sm leading-[1.55] text-[var(--color-text-muted)]">{day.introduction}</p>
                  <div className="grid gap-3 md:grid-cols-2">{day.resources.map(resourceLink)}</div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ActiveDashboard({ data }: { data: DashboardPayload }) {
  const trackCompletion = summarizeSogpTrackCompletion(data.tracks);
  const completed = trackCompletion.requiredCompleted;
  const total = trackCompletion.requiredTotal;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const now = new Date(data.generatedAt).getTime();
  const nextTrack = data.tracks.find(
    (track) =>
      track.isRequired &&
      !track.completed &&
      new Date(track.releaseAt).getTime() <= now,
  );
  const nextClass = data.liveClasses.find(
    (item) => item.status !== "cancelled" && new Date(item.endsAt).getTime() > now,
  );

  return (
    <div className="grid gap-5">
      <section className="grid min-h-64 content-between rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
        <div className="flex items-center justify-between gap-4">
          <p className="font-[var(--font-be-vietnam-pro)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Continue learning</p>
          <span className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-brand-blue)]">{percent}%</span>
        </div>
        {nextTrack ? (
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div className="grid gap-2">
              <span className="font-[var(--font-be-vietnam-pro)] text-xs text-[var(--color-text-muted)]">Day {nextTrack.dayNumber} · Week {nextTrack.weekNumber}</span>
              <h2 className="font-[var(--font-sen)] text-[clamp(2rem,4vw,3.2rem)] font-semibold leading-[0.98] tracking-[-0.06em] text-[var(--color-text-strong)]">{nextTrack.lesson.title}</h2>
            </div>
            <Link href={`/dashboard/sogp/course/day/${nextTrack.dayNumber}`} className="site-button-text inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white">Continue lesson <ArrowRight className="size-4" /></Link>
          </div>
        ) : (
          <div className="grid gap-2"><h2 className="font-[var(--font-sen)] text-3xl font-semibold tracking-[-0.05em] text-[var(--color-text-strong)]">Your next track will appear here</h2><p className="text-sm text-[var(--color-text-muted)]">The SOGP team is finalising your course structure.</p></div>
        )}
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"><div className="h-full rounded-full bg-[var(--color-brand-blue)]" style={{ width: `${percent}%` }} /></div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
          <div className="flex items-center gap-2"><CalendarDays className="size-4 text-[var(--color-brand-blue)]" /><h3 className="font-[var(--font-sen)] text-lg font-semibold text-[var(--color-text-strong)]">Next live class</h3></div>
          {nextClass ? <div className="mt-6 grid gap-3"><p className="font-[var(--font-be-vietnam-pro)] text-sm font-semibold text-[var(--color-text-strong)]">{nextClass.title}</p><p className="font-[var(--font-be-vietnam-pro)] text-xs text-[var(--color-text-muted)]">{formatDate(nextClass.startsAt)}</p>{nextClass.youtubeLiveUrl ? <a href={nextClass.youtubeLiveUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)]">Watch on YouTube <ExternalLink className="size-3.5" /></a> : null}</div> : <p className="mt-6 font-[var(--font-be-vietnam-pro)] text-sm text-[var(--color-text-muted)]">Schedule coming soon.</p>}
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
          <div className="flex items-center gap-2"><Radio className="size-4 text-[var(--color-brand-blue)]" /><h3 className="font-[var(--font-sen)] text-lg font-semibold text-[var(--color-text-strong)]">Week progress</h3></div>
          <div className="mt-6 grid grid-cols-4 gap-3">{[1,2,3,4].map((week) => { const weekTracks=data.tracks.filter((track)=>track.isRequired&&track.weekNumber===week); const done=weekTracks.filter((track)=>track.completed).length; const value=weekTracks.length?Math.round(done/weekTracks.length*100):0; return <div key={week} className="grid justify-items-center gap-2"><div className={`grid size-10 place-items-center rounded-full border-2 ${value===100?"border-[var(--color-brand-lime)] bg-[var(--color-brand-lime)]":"border-[var(--color-line-strong)]"}`}><span className="text-xs font-semibold">{week}</span></div><span className="text-[0.65rem] text-[var(--color-text-muted)]">{value}%</span></div>;})}</div>
        </div>
      </section>
    </div>
  );
}

function ContextRail({ data }: { data: DashboardPayload }) {
  const trackCompletion = summarizeSogpTrackCompletion(data.tracks);
  const completed = trackCompletion.requiredCompleted;
  const prayerDays = Math.max(1, Math.round((new Date(data.cohort.endsAt).getTime() - new Date(data.cohort.startsAt).getTime()) / 86_400_000) + 1);
  const eligibility = calculateSogpEligibility({ completedTracks: completed, totalTracks: trackCompletion.requiredTotal, prayerDaysAttended: data.prayerDaysAttended, prayerDaysAvailable: prayerDays, liveClassesAttended: data.liveClassesAttended, policy: data.cohort.assessmentPolicy });
  const telegramUrl = data.cohort.telegramDiscussionUrl ?? data.cohort.telegramChannelUrl ?? (data.cohort.telegramBotUsername ? `https://t.me/${data.cohort.telegramBotUsername.replace(/^@/, "")}` : null);
  return (
    <aside className="grid content-start gap-4">
      <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
        <MessageCircleMore className="size-7 text-[#229ED9]" />
        <h2 className="mt-5 font-[var(--font-sen)] text-lg font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">Telegram community</h2>
        <p className="mt-2 font-[var(--font-be-vietnam-pro)] text-xs leading-[1.5] text-[var(--color-text-muted)]">Ask questions by text or voice note and learn with your cohort.</p>
        {telegramUrl ? <a href={telegramUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white">Open community <ExternalLink className="size-3.5" /></a> : <p className="mt-5 text-xs font-medium text-amber-700">Community link coming soon.</p>}
      </section>
      <section className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
        <h2 className="font-[var(--font-sen)] text-lg font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">Assessment readiness</h2>
        <div className="mt-5 grid gap-4">{[
          ["Required tracks", `${completed}/${trackCompletion.requiredTotal || 24}`, !eligibility.unmet.includes("tracks")],
          ["Prayer Watch", `${eligibility.prayerPercent}%`, !eligibility.unmet.includes("prayer_watch")],
          ["Live classes", String(data.liveClassesAttended), !eligibility.unmet.includes("live_classes")],
        ].map(([label,value,ready])=><div key={String(label)} className="grid grid-cols-[1.25rem_1fr_auto] items-center gap-2"><span className={`grid size-5 place-items-center rounded-full ${ready?"bg-[var(--color-brand-lime)]":"border border-[var(--color-line-strong)]"}`}>{ready?<Check className="size-3 text-[var(--color-brand-blue)]"/>:<Circle className="size-2 text-[var(--color-text-muted)]"/>}</span><span className="text-xs font-medium text-[var(--color-text-strong)]">{label}</span><span className="text-xs text-[var(--color-text-muted)]">{value}</span></div>)}</div>
      </section>
    </aside>
  );
}

function FormationProgress({ data }: { data: DashboardPayload }) {
  const cohortDays = Math.max(
    1,
    Math.round(
      (new Date(data.cohort.endsAt).getTime() -
        new Date(data.cohort.startsAt).getTime()) /
        86_400_000,
    ) + 1,
  );
  const requiredMorningWatches = Math.ceil(
    (data.cohort.assessmentPolicy.requiredPrayerWatchPercent / 100) *
      cohortDays,
  );
  const items = [
    {
      title: "Morning Prayer Watch",
      description: "Log the morning watches you attend during your SOGP cohort.",
      value: `${data.prayerDaysAttended} / ${requiredMorningWatches}`,
      hint: `${data.cohort.assessmentPolicy.requiredPrayerWatchPercent}% required`,
      href: "/dashboard/prayer-watch",
      Icon: Sunrise,
    },
  ];

  return (
    <section id="progress" className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Mandatory formation</p>
          <h2 className="mt-1 font-[var(--font-sen)] text-xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">Keep your daily spiritual rhythm</h2>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(({ title, description, value, hint, href, Icon }) => (
          <Link key={title} href={href} className="group grid min-h-48 content-between rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5 transition-transform duration-150 hover:-translate-y-px">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--color-brand-sky)]"><Icon className="size-5 text-[var(--color-brand-blue)]" /></span>
              <div className="text-right"><strong className="font-[var(--font-sen)] text-xl text-[var(--color-brand-blue)]">{value}</strong><p className="text-[0.65rem] text-[var(--color-text-muted)]">{hint}</p></div>
            </div>
            <div className="grid gap-2"><h3 className="font-[var(--font-sen)] text-lg font-semibold tracking-[-0.04em] text-[var(--color-text-strong)]">{title}</h3><p className="text-xs leading-[1.5] text-[var(--color-text-muted)]">{description}</p><span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-blue)]">Log progress <ArrowRight className="size-3.5" /></span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SogpDashboard() {
  const { data } = useSuspenseQuery({
    queryKey: ["sogp", "dashboard"],
    queryFn: fetchDashboard,
  });

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface)] pb-16">
      <header className="border-b border-[var(--color-line)] bg-white">
        <div className="site-shell-page sogp-shell-page flex min-h-28 items-end justify-between gap-4 pb-6 pt-8">
          <div className="grid gap-1"><p className="font-[var(--font-be-vietnam-pro)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">School of God&apos;s Purpose</p><h1 className="font-[var(--font-sen)] text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.06em] text-[var(--color-text-strong)]">Welcome, {firstName(data.enrollment.name)}</h1></div>
          <Link href="/dashboard" className="hidden text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-brand-blue)] sm:inline">Pleros dashboard</Link>
        </div>
      </header>
      <div className="site-shell-page sogp-shell-page grid gap-5 py-8 lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
        <CurriculumRail data={data} />
        <div className="grid content-start gap-7">
          {data.learnerState === "preparing" ? <PreparingDashboard data={data} /> : <ActiveDashboard data={data} />}
          <FormationProgress data={data} />
        </div>
        <ContextRail data={data} />
      </div>
      <nav aria-label="SOGP navigation" className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-1.5 shadow-[var(--shadow-lg)] lg:hidden">
        {[{label:"Home",Icon:BookOpen,href:"/dashboard/sogp"},{label:"Course",Icon:Play,href:"/dashboard/sogp/course"},{label:"Community",Icon:MessageCircleMore,href:data.cohort.telegramDiscussionUrl??"#"},{label:"Progress",Icon:Check,href:"/dashboard/sogp#progress"}].map(({label,Icon,href})=><Link key={label} href={href} className="grid min-h-12 justify-items-center content-center gap-1 rounded-[0.45rem] text-[0.62rem] font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-brand-sky)] hover:text-[var(--color-brand-blue)]"><Icon className="size-4"/>{label}</Link>)}
      </nav>
    </section>
  );
}
