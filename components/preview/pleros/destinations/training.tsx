"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  AwardIcon,
  BookOpenIcon,
  CheckIcon,
  CopyIcon,
  FlameIcon,
  GraduationCapIcon,
  LinkIcon,
  LockIcon,
  PlayCircleIcon,
  SunriseIcon,
  UsersIcon,
} from "lucide-react";

import { discipleshipJourneySections } from "@/lib/discipleship-journey-content";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";
import { SOGP_LEVELS, SOGP_TRACKS } from "@/lib/sogp/curriculum";
import { shiftDate } from "@/lib/sogp/daily-date";
import { LEADERBOARD_POINTS, computeStreaks, rankByPoints, scoreParticipant } from "@/lib/sogp/leaderboard-scoring";
import { buildPreSogpSeed } from "@/lib/sogp/preparation-seed";
import { cn } from "@/lib/utils";
import { devotionFor } from "@/lib/preview/pleros/daily-report";
import { cohortStartFor, seeded } from "@/lib/preview/pleros/fixtures";
import {
  COHORT_WEEKS,
  cohortLabel,
  dayState,
  isDayComplete,
  prayedMorning,
  sogpProgress,
  sogpSchedule,
  teachingDone,
  type SogpDayState,
} from "@/lib/preview/pleros/sogp";
import type { DemoPerson, DemoState } from "@/lib/preview/pleros/types";

import { useDemo } from "../demo-context";
import { Badge, EmptyState, PageHeader, StatStrip, buttonPrimary, buttonSecondary, dayNumber, focusRing, longDate, panel, shortDate, weekday } from "../ui";
import { Disclosure, ExternalLink, IconChip, ListPanel, ProgressBar, Row, Section, Tick, joinMonth } from "./parts";

const STATE_TONE: Record<SogpDayState, string> = {
  complete: "bg-(--color-brand-lime) text-(--color-brand-blue)",
  missed: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  today: "ring-2 ring-inset ring-(--color-brand-blue) text-(--color-brand-blue)",
  upcoming: "bg-(--color-surface-muted) text-(--color-text-muted)",
};

const STATE_LABEL: Record<SogpDayState, string> = {
  complete: "Complete",
  missed: "Missed, still open",
  today: "Today",
  upcoming: "Upcoming",
};

function NotInCohort({ title }: { title: string }) {
  const { today } = useDemo();
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={cohortLabel(today)} title={title} />
      <EmptyState icon={<GraduationCapIcon className="size-5" aria-hidden />} title="You're not in the current cohort" />
    </div>
  );
}

function isStreamable(url: string) {
  return !/youtube\.com|youtu\.be/.test(url);
}

// ─── Pre-SOGP ─────────────────────────────────────────────────────────────

/** Preparation ran for the fourteen days before the demo cohort's first Monday. */
function preparationStart(today: string) {
  return shiftDate(cohortStartFor(today), -PRE_SOGP_PREPARATION_DAYS);
}

export function PreSogpDestination() {
  const { viewer, today } = useDemo();
  if (!viewer.inCohort) return <NotInCohort title="Pre-SOGP" />;
  return <PreSogpJourney key={viewer.id} viewer={viewer} today={today} />;
}

function PreSogpJourney({ viewer, today }: { viewer: DemoPerson; today: string }) {
  const start = preparationStart(today);
  // The real seed order (Discover Purpose, Gospel Answers, Discipleship Foundations).
  const seed = buildPreSogpSeed(new Date(`${start}T00:00:00+01:00`)).map((lesson, index) => ({ ...lesson, dateKey: shiftDate(start, index) }));
  const [done, setDone] = useState(() =>
    Object.fromEntries(
      seed.map((lesson) => [
        lesson.dayNumber,
        {
          lesson: seeded(`${viewer.id}:prep-lesson:${lesson.dayNumber}`) < 0.85,
          prayer: seeded(`${viewer.id}:prep-prayer:${lesson.dayNumber}`) < 0.75,
        },
      ]),
    ) as Record<number, { lesson: boolean; prayer: boolean }>,
  );
  const [selected, setSelected] = useState(seed.find((lesson) => !done[lesson.dayNumber]?.lesson || !done[lesson.dayNumber]?.prayer)?.dayNumber ?? 1);
  const lesson = seed.find((item) => item.dayNumber === selected) ?? seed[0]!;
  const status = done[lesson.dayNumber]!;
  const complete = seed.filter((item) => done[item.dayNumber]?.lesson && done[item.dayNumber]?.prayer).length;

  function toggle(key: "lesson" | "prayer") {
    setDone((current) => ({ ...current, [lesson.dayNumber]: { ...current[lesson.dayNumber]!, [key]: !current[lesson.dayNumber]![key] } }));
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={`Pre-SOGP · ${shortDate(start)} to ${shortDate(shiftDate(start, PRE_SOGP_PREPARATION_DAYS - 1))}`} title="Preparation" actions={<Badge tone="done">{complete} of {seed.length} days complete</Badge>} />

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <section aria-label="Preparation calendar" className={cn(panel, "h-fit p-3")}>
          <div className="grid grid-cols-7 gap-1">
            {seed.map((item) => {
              const entry = done[item.dayNumber]!;
              const state: SogpDayState = entry.lesson && entry.prayer ? "complete" : item.dateKey < today ? "missed" : item.dateKey === today ? "today" : "upcoming";
              return (
                <button
                  key={item.dayNumber}
                  type="button"
                  aria-pressed={item.dayNumber === selected}
                  aria-label={`Day ${item.dayNumber}, ${longDate(item.dateKey)}, ${STATE_LABEL[state]}`}
                  onClick={() => setSelected(item.dayNumber)}
                  className={cn("grid justify-items-center gap-1 rounded-xl border py-1.5", focusRing, item.dayNumber === selected ? "border-(--color-brand-blue)" : "border-transparent hover:bg-(--color-surface-muted)")}
                >
                  <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-(--color-text-muted)">{weekday(item.dateKey)}</span>
                  <span className={cn("grid size-7 place-items-center rounded-full text-[12.5px] font-medium tabular-nums", STATE_TONE[state])}>{dayNumber(item.dateKey)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-(--color-line) pt-3">
            <ProgressBar value={complete} total={seed.length} label="Preparation progress" />
          </div>
        </section>

        <section className={cn(panel, "overflow-hidden")} aria-labelledby="prep-day">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--color-line) px-4 py-3.5 sm:px-5">
            <h2 id="prep-day" className="text-[15px] font-medium text-(--color-text-strong)">{lesson.countdownLabel}</h2>
            <p className="text-[12.5px] text-(--color-text-muted)">{longDate(lesson.dateKey)}</p>
          </div>
          <div className="grid gap-4 px-4 py-4 sm:px-5">
            <div className="grid gap-1">
              <p className="text-[14px] font-medium text-(--color-text-strong)">{lesson.title}</p>
              <p className="text-[13px] leading-relaxed text-(--color-text-muted)">{lesson.introduction}</p>
            </div>
            {isStreamable(lesson.url) ? (
              <video key={lesson.url} controls playsInline preload="metadata" controlsList="nodownload" src={lesson.url} className="aspect-video w-full rounded-[var(--radius-md)] bg-black" />
            ) : (
              <ExternalLink href={lesson.url}>Watch the lesson</ExternalLink>
            )}
          </div>
          <ol className="divide-y divide-(--color-line) border-t border-(--color-line)">
            <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <IconChip icon={PlayCircleIcon} />
              <span className="flex-1 text-[13.5px] font-medium text-(--color-text-strong)">Preparation lesson</span>
              <Tick done={status.lesson} label="Lesson complete" onToggle={() => toggle("lesson")} />
            </li>
            <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <IconChip icon={SunriseIcon} />
              <span className="grid flex-1">
                <span className="text-[13.5px] font-medium text-(--color-text-strong)">Morning Prayer Watch</span>
                <span className="text-[12px] text-(--color-text-muted)">5:30 am</span>
              </span>
              <Tick done={status.prayer} label="Morning Prayer Watch attended" onToggle={() => toggle("prayer")} />
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

// ─── SOGP course ──────────────────────────────────────────────────────────

export function SogpCourseDestination() {
  const { state, viewer, today, href } = useDemo();
  if (!viewer.inCohort) return <NotInCohort title="SOGP course" />;
  const schedule = sogpSchedule(today);
  const progress = sogpProgress(state, viewer.id);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={`${cohortLabel(today)} · week ${progress.currentWeek} of ${COHORT_WEEKS}`} title="SOGP course" actions={<Link href={href("sogp")} className={buttonPrimary}>Open today</Link>} />
      <StatStrip
        items={[
          { label: "Teachings", value: `${progress.teachings}/${progress.teachingsTotal}` },
          { label: "Morning Prayer Watch", value: `${progress.prayerPercent}%`, detail: `${progress.prayerDays} of ${progress.elapsedDays} days` },
          { label: "Reviews", value: `${progress.reviews}/${progress.reviewsTotal}` },
          { label: "Current level", value: progress.currentWeek },
        ]}
      />
      <div className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
        {SOGP_LEVELS.map((level) => {
          const days = schedule.filter((day) => day.level === level.level);
          const teachings = days.filter((day) => day.kind === "teaching");
          const completed = teachings.filter((day) => teachingDone(devotionFor(state, viewer.id, day.dateKey))).length;
          return (
            <Disclosure
              key={level.level}
              defaultOpen={level.level === progress.currentWeek}
              summary={
                <span className="grid gap-1.5">
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-[14px] font-medium text-(--color-text-strong)">Level {level.level}: {level.title}</span>
                    <span className="text-[12px] tabular-nums text-(--color-text-muted)">{completed} of 6</span>
                  </span>
                  <ProgressBar value={completed} total={6} label={`Level ${level.level} progress`} />
                </span>
              }
            >
              <p className="mb-2 text-[12.5px] leading-relaxed text-(--color-text-muted)">{level.description}</p>
              <ol className="grid gap-1">
                {days.map((day) => {
                  const status = dayState(state, viewer.id, day);
                  const locked = day.dateKey > today;
                  return (
                    <li key={day.dateKey} className="flex items-center gap-3 py-1.5">
                      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[11.5px] font-medium tabular-nums", STATE_TONE[status])}>
                        {status === "complete" ? <CheckIcon className="size-3.5" aria-hidden /> : day.kind === "review" ? "R" : day.track?.levelPosition}
                      </span>
                      <span className="grid min-w-0 flex-1">
                        <span className={cn("truncate text-[13px]", locked ? "text-(--color-text-muted)" : "text-(--color-text-strong)")}>{day.kind === "review" ? "Sunday review" : day.track?.title}</span>
                        <span className="text-[11.5px] text-(--color-text-muted)">{shortDate(day.dateKey)} · {STATE_LABEL[status]}</span>
                      </span>
                      {locked ? <LockIcon className="size-3.5 text-(--color-text-muted)" aria-label="Opens on its date" /> : null}
                    </li>
                  );
                })}
              </ol>
            </Disclosure>
          );
        })}
      </div>
    </div>
  );
}

// ─── SOGP leaderboard ─────────────────────────────────────────────────────

function cohortScore(state: DemoState, person: DemoPerson) {
  const schedule = sogpSchedule(state.today).filter((day) => day.dateKey <= state.today);
  const counts = { quizPassed: 0, writtenApproved: 0, daysCompleted: 0, prayerWatch: 0, reviews: 0, preparationDays: 0, shares: 0, referrals: 0 };
  const active: string[] = [];
  for (const day of schedule) {
    const record = devotionFor(state, person.id, day.dateKey);
    if (record.sogp?.quizAttempted) counts.quizPassed += 1;
    if (record.sogp?.writtenSubmitted) counts.writtenApproved += 1;
    if (isDayComplete(day, record)) counts.daysCompleted += 1;
    if (prayedMorning(record)) counts.prayerWatch += 1;
    if (record.sogp?.reviewAttended) counts.reviews += 1;
    if (record.sogp?.listened || prayedMorning(record) || record.sogp?.reviewAttended) active.push(day.dateKey);
  }
  counts.preparationDays = 9 + Math.floor(seeded(`${person.id}:prep-days`) * 6);
  counts.shares = Math.floor(seeded(`${person.id}:shares`) * 4);
  counts.referrals = Math.floor(seeded(`${person.id}:referrals`) * 3);
  const streaks = computeStreaks(active, state.today);
  return { breakdown: scoreParticipant(counts, streaks.longest), currentStreak: streaks.current };
}

export function SogpLeaderboardDestination() {
  const { state, viewer, today } = useDemo();
  if (!viewer.inCohort) return <NotInCohort title="SOGP leaderboard" />;
  const rows = rankByPoints(
    state.people
      .filter((person) => person.inCohort)
      .map((person) => {
        const score = cohortScore(state, person);
        return { id: person.id, name: person.firstName, points: score.breakdown.total, breakdown: score.breakdown, currentStreak: score.currentStreak };
      }),
  );
  const me = rows.find((row) => row.id === viewer.id)!;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={cohortLabel(today)} title="SOGP leaderboard" />
      <StatStrip
        items={[
          { label: "Your rank", value: `#${me.rank}`, detail: `of ${rows.length}` },
          { label: "Course", value: me.breakdown.course },
          { label: "Attendance", value: me.breakdown.attendance },
          { label: "Sharing and streaks", value: me.breakdown.sharing + me.breakdown.streak },
        ]}
      />
      <Section title="Cohort ranking" detail={`${rows.length} learners`}>
        <ol className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
          {rows.map((row) => (
            <li key={row.id} className={cn("flex items-center gap-3 px-4 py-2.5 sm:px-5", row.id === viewer.id && "bg-(--color-brand-sky-soft)")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-medium tabular-nums", row.rank <= 3 ? "bg-(--color-brand-lime) text-(--color-brand-blue)" : "bg-(--color-surface-muted) text-(--color-text-muted)")}>{row.rank}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-(--color-text-strong)">{row.name}{row.id === viewer.id ? " (you)" : ""}</span>
              {row.currentStreak > 1 ? <span className="inline-flex items-center gap-0.5 text-[12px] text-(--color-text-muted)"><FlameIcon className="size-3.5" aria-hidden />{row.currentStreak}</span> : null}
              <span className="w-14 text-right text-[13px] font-medium tabular-nums text-(--color-brand-blue)">{row.points}</span>
            </li>
          ))}
        </ol>
      </Section>
      <p className="text-[12px] text-(--color-text-muted)">
        {LEADERBOARD_POINTS.quizPassed} per quiz, {LEADERBOARD_POINTS.dayCompleted} per completed day, {LEADERBOARD_POINTS.prayerWatch} per morning Prayer Watch, {LEADERBOARD_POINTS.review} per review and {LEADERBOARD_POINTS.referral} per referral. First names only.
      </p>
    </div>
  );
}

// ─── Certificate ──────────────────────────────────────────────────────────

const CERTIFICATE_DAYS = COHORT_WEEKS * 7;
const THRESHOLD = 0.8;

export function CertificateDestination() {
  const { state, viewer, today } = useDemo();
  if (!viewer.inCohort) return <NotInCohort title="Certificate" />;
  const schedule = sogpSchedule(today);
  const elapsed = schedule.filter((day) => day.dateKey <= today);
  const assessments = schedule.filter((day) => day.kind === "teaching" && teachingDone(devotionFor(state, viewer.id, day.dateKey))).length;
  const prayer = elapsed.filter((day) => prayedMorning(devotionFor(state, viewer.id, day.dateKey))).length;
  // Daily review attendance is synthetic in the demo: one required session per cohort day.
  const reviews = elapsed.filter((day) => seeded(`${viewer.id}:${day.dateKey}:daily-review`) < 0.8).length;
  const needed = Math.ceil(CERTIFICATE_DAYS * THRESHOLD);
  const requirements = [
    { label: "All assessments", value: assessments, total: SOGP_TRACKS.length, met: assessments >= SOGP_TRACKS.length, detail: `${assessments} of ${SOGP_TRACKS.length} teachings assessed` },
    { label: "Morning Prayer Watch", value: prayer, total: needed, met: prayer >= needed, detail: `${prayer} of ${CERTIFICATE_DAYS} cohort days · ${needed} needed` },
    { label: "Daily review sessions", value: reviews, total: needed, met: reviews >= needed, detail: `${reviews} of ${CERTIFICATE_DAYS} sessions · ${needed} needed` },
  ];
  const eligible = requirements.every((item) => item.met);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={cohortLabel(today)} title="Certificate" actions={<Badge tone={eligible ? "done" : "neutral"}>{eligible ? "Eligible" : "In progress"}</Badge>} />
      <Section title="Requirements">
        <ListPanel>
          {requirements.map((item) => (
            <li key={item.label} className="grid gap-2 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-medium text-(--color-text-strong)">{item.label}</span>
                {item.met ? <Badge tone="done"><CheckIcon className="size-3" aria-hidden />Met</Badge> : <span className="text-[12px] tabular-nums text-(--color-text-muted)">{item.value}/{item.total}</span>}
              </div>
              <ProgressBar value={item.value} total={item.total} label={item.label} />
              <span className="text-[12px] text-(--color-text-muted)">{item.detail}</span>
            </li>
          ))}
        </ListPanel>
      </Section>

      <Section title="Sample certificate" detail="Illustration only, never issued">
        <figure className="relative overflow-hidden rounded-[var(--radius-lg)] border-2 border-(--color-brand-blue)/20 bg-white px-6 py-10 text-center">
          <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center text-[64px] font-semibold uppercase tracking-[0.2em] text-(--color-brand-blue)/[0.06] -rotate-12">Sample</span>
          <div className="relative grid justify-items-center gap-3">
            <IconChip icon={AwardIcon} className="size-11" />
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-(--color-text-muted)">School of God&apos;s Purpose</p>
            <p className="text-[13px] text-(--color-text-muted)">This sample shows the layout for</p>
            <p className="text-[22px] font-medium tracking-[-0.02em] text-(--color-brand-blue)">{viewer.name}</p>
            <p className="max-w-[36ch] text-[13px] leading-relaxed text-(--color-text-muted)">{cohortLabel(today)} · four levels, twenty-four teachings</p>
            <Badge tone="preview">Sample · not a certificate</Badge>
          </div>
        </figure>
      </Section>
    </div>
  );
}

// ─── Referrals ────────────────────────────────────────────────────────────

const REFERRAL_STAGES = ["Enrolled", "Preparing", "In the course"] as const;

export function ReferralsDestination() {
  const { state, viewer, notify } = useDemo();
  const code = `demo${Math.floor(seeded(`${viewer.id}:ref`) * 0xffff).toString(16).padStart(4, "0")}`;
  const link = `pleros.org/sogp?ref=${code}`;
  const referred = state.people
    .filter((person) => person.id !== viewer.id && person.tier === "disciple")
    .filter((person) => seeded(`${viewer.id}:${person.id}:referred`) < 0.45)
    .slice(0, 4);

  function copy() {
    navigator.clipboard?.writeText(link).then(
      () => notify("Demo link copied."),
      () => notify("Copy is blocked in this browser.", "error"),
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Referrals" actions={<Badge tone="blue"><UsersIcon className="size-3" aria-hidden />{referred.length} joined</Badge>} />
      <Section title="Your link">
        <div className={cn(panel, "flex flex-wrap items-center gap-3 p-4 sm:p-5")}>
          <IconChip icon={LinkIcon} />
          <code className="min-w-0 flex-1 truncate text-[13.5px] text-(--color-text-strong)">{link}</code>
          <Badge tone="preview">Demo code</Badge>
          <button type="button" onClick={copy} className={buttonSecondary}><CopyIcon className="size-3.5" aria-hidden />Copy link</button>
        </div>
      </Section>
      <Section title="People who joined" detail="First names only">
        {referred.length ? (
          <ListPanel>
            {referred.map((person, index) => {
              const stage = REFERRAL_STAGES[Math.floor(seeded(`${person.id}:stage`) * REFERRAL_STAGES.length)] ?? REFERRAL_STAGES[0];
              return (
                <Row
                  key={person.id}
                  icon={UsersIcon}
                  title={person.firstName}
                  detail={joinMonth(shiftDate(state.today, -(12 + index * 5)))}
                  trailing={<Badge tone={stage === "In the course" ? "done" : "neutral"}>{stage}</Badge>}
                />
              );
            })}
          </ListPanel>
        ) : (
          <EmptyState icon={<UsersIcon className="size-5" aria-hidden />} title="No one has joined with your link yet" />
        )}
      </Section>
    </div>
  );
}

// ─── Discipleship journey ─────────────────────────────────────────────────

export function DiscipleshipJourneyDestination() {
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  return (
    <div className="grid gap-6">
      <PageHeader title="Discipleship journey" />
      <div className="grid gap-4">
        {discipleshipJourneySections.map((section) => {
          const seen = section.videos.filter((video) => watched[video.id]).length;
          return (
            <div key={section.id} className={cn(panel, "overflow-hidden")}>
              <Disclosure
                summary={
                  <span className="flex items-center gap-3">
                    {section.thumbnailSrc ? (
                      <span className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-(--color-surface-muted)">
                        <Image src={section.thumbnailSrc} alt="" fill unoptimized className="object-cover" />
                      </span>
                    ) : (
                      <IconChip icon={BookOpenIcon} />
                    )}
                    <span className="grid min-w-0 gap-0.5">
                      <span className="text-[14px] font-medium text-(--color-text-strong)">{section.title}</span>
                      <span className="text-[12px] tabular-nums text-(--color-text-muted)">{seen} of {section.videos.length} watched</span>
                    </span>
                  </span>
                }
              >
                <ol className="grid divide-y divide-(--color-line)">
                  {section.videos.map((video, index) => (
                    <li key={video.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-6 shrink-0 text-[12px] tabular-nums text-(--color-text-muted)">{index + 1}</span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="text-[13px] font-medium text-(--color-text-strong)">{video.title}</span>
                        <ExternalLink href={video.href} className="w-fit">Watch</ExternalLink>
                      </span>
                      <Tick done={Boolean(watched[video.id])} label={`Mark ${video.title} watched`} onToggle={() => setWatched((current) => ({ ...current, [video.id]: !current[video.id] }))} />
                    </li>
                  ))}
                </ol>
              </Disclosure>
            </div>
          );
        })}
      </div>
    </div>
  );
}
