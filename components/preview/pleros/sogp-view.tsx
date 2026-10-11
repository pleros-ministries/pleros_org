"use client";

import { useState } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleIcon,
  GraduationCapIcon,
  HandHeartIcon,
  HeadphonesIcon,
  LockIcon,
  PauseIcon,
  PlayIcon,
  RadioIcon,
} from "lucide-react";

import type { DayActivity } from "@/lib/community/ministry-report";
import { SOGP_LEVELS, type SogpCurriculumTrack } from "@/lib/sogp/curriculum";
import { cn } from "@/lib/utils";
import { devotionFor, isWritableDay } from "@/lib/preview/pleros/daily-report";
import {
  COHORT_WEEKS,
  cohortLabel,
  dayState,
  levelTitle,
  prayedMorning,
  sogpProgress,
  sogpSchedule,
  teachingDone,
  type SogpDay,
  type SogpDayState,
} from "@/lib/preview/pleros/sogp";
import { updateDevotion } from "@/lib/preview/pleros/store";

import { useDemo } from "./demo-context";
import {
  EmptyState,
  PageHeader,
  SectionTitle,
  Sheet,
  buttonPrimary,
  buttonSecondary,
  buttonSmall,
  dayNumber,
  focusRing,
  longDate,
  panel,
  relativeDay,
  weekday,
} from "./ui";

const DAY_STATE_LABEL: Record<SogpDayState, string> = {
  complete: "complete",
  missed: "missed, still open",
  today: "today",
  upcoming: "upcoming",
};

export function SogpView() {
  const { state, viewer, today, run } = useDemo();
  const schedule = sogpSchedule(today);
  const todayEntry = schedule.find((day) => day.dateKey === today) ?? schedule.at(-1)!;
  const [selectedKey, setSelectedKey] = useState(todayEntry.dateKey);
  const [week, setWeek] = useState(todayEntry.week);
  const [lessonDay, setLessonDay] = useState<SogpDay | null>(null);

  if (!viewer.inCohort) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow={cohortLabel(today)} title="SOGP" />
        <EmptyState icon={<GraduationCapIcon className="size-5" aria-hidden />} title="You're not in the current cohort"></EmptyState>
      </div>
    );
  }

  const selected = schedule.find((day) => day.dateKey === selectedKey) ?? todayEntry;
  const weekDays = schedule.filter((day) => day.week === week);
  const progress = sogpProgress(state, viewer.id);
  const record = devotionFor(state, viewer.id, selected.dateKey);
  const writable = isWritableDay(selected.dateKey, today);
  const future = selected.dateKey > today;

  function save(next: DayActivity) {
    run((current) => updateDevotion(current, viewer.id, selected.dateKey, next));
  }

  const sogp = record.sogp ?? {
    listened: selected.kind === "teaching" ? false : null,
    quizAttempted: false,
    writtenSubmitted: false,
    reviewAttended: false,
    preparationDone: false,
  };
  const done = [
    selected.kind === "teaching" ? teachingDone(record) : sogp.reviewAttended,
    prayedMorning(record),
  ].filter(Boolean).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${cohortLabel(today)} · week ${todayEntry.week} of ${COHORT_WEEKS}`}
        title={`Level ${todayEntry.level}: ${levelTitle(todayEntry.level)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-5">
          <section aria-labelledby="week" className={cn(panel, "px-3 py-3 sm:px-4")}>
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <h2 id="week" className="text-[14px] font-medium text-(--color-text-strong)">
                Week {week} · Level {week}
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous week"
                  disabled={week <= 1}
                  onClick={() => setWeek((value) => value - 1)}
                  className={cn("grid size-8 place-items-center rounded-full text-(--color-text-muted) hover:bg-(--color-surface-muted) disabled:opacity-30", focusRing)}
                >
                  <ChevronLeftIcon className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next week"
                  disabled={week >= COHORT_WEEKS}
                  onClick={() => setWeek((value) => value + 1)}
                  className={cn("grid size-8 place-items-center rounded-full text-(--color-text-muted) hover:bg-(--color-surface-muted) disabled:opacity-30", focusRing)}
                >
                  <ChevronRightIcon className="size-4" aria-hidden />
                </button>
              </div>
            </div>
            <div role="group" aria-label={`Week ${week} days`} className="grid grid-cols-7 gap-1">
              {weekDays.map((day) => {
                const status = dayState(state, viewer.id, day);
                const active = day.dateKey === selected.dateKey;
                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${longDate(day.dateKey)}, ${day.kind === "review" ? "review" : day.track?.title}, ${DAY_STATE_LABEL[status]}`}
                    onClick={() => setSelectedKey(day.dateKey)}
                    className={cn(
                      "grid min-h-[66px] justify-items-center gap-1 rounded-xl border pb-2 pt-1.5 transition-[background-color,border-color] duration-150",
                      focusRing,
                      active ? "border-(--color-brand-blue) bg-white shadow-[0_0_0_1px_var(--color-brand-blue)]" : "border-transparent hover:bg-(--color-surface-muted)",
                    )}
                  >
                    <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-(--color-text-muted)">
                      {weekday(day.dateKey)}
                    </span>
                    <span
                      className={cn(
                        "grid size-8 place-items-center rounded-full text-[14px] font-medium tabular-nums",
                        status === "complete" && "bg-(--color-brand-lime) text-(--color-brand-blue)",
                        status === "missed" && "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
                        status === "today" && "ring-2 ring-inset ring-(--color-brand-blue) text-(--color-brand-blue)",
                        status === "upcoming" && "bg-(--color-surface-muted) text-(--color-text-muted)",
                      )}
                    >
                      {dayNumber(day.dateKey)}
                    </span>
                  </button>
                );
              })}
            </div>
            
          </section>

          <section aria-labelledby="tasks" className={cn(panel, "overflow-hidden")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-(--color-line) px-4 py-3.5 sm:px-5">
              <h2 id="tasks" className="text-[15px] font-medium text-(--color-text-strong)">
                {relativeDay(selected.dateKey, today) === "Today" ? `Today, ${longDate(selected.dateKey)}` : longDate(selected.dateKey)}
              </h2>
              <p className="text-[12.5px] font-medium tabular-nums text-(--color-brand-blue)">{done} of 2 done</p>
            </div>
            {future ? (
              <p className="flex items-center gap-2 px-4 py-6 text-[13.5px] text-(--color-text-muted) sm:px-5">
                <LockIcon className="size-4" aria-hidden />
                This day opens on its date.
              </p>
            ) : (
              <ol className="divide-y divide-(--color-line)">
                {selected.kind === "teaching" && selected.track ? (
                  <Task
                    index={1}
                    done={teachingDone(record)}
                    icon={HeadphonesIcon}
                    title={selected.track.title}
                    detail={`Teaching ${selected.track.levelPosition} of 6`}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      <StepChip done={Boolean(sogp.listened)} label="Lesson" />
                      <StepChip done={sogp.quizAttempted} label="Quiz" />
                      <StepChip done={sogp.writtenSubmitted} label="Response" />
                    </div>
                    <button type="button" className={cn(buttonPrimary, "w-fit")} onClick={() => setLessonDay(selected)}>
                      {teachingDone(record) ? "Review lesson" : "Open lesson"}
                    </button>
                  </Task>
                ) : (
                  <Task
                    index={1}
                    done={sogp.reviewAttended}
                    icon={RadioIcon}
                    title={`Level ${selected.level} live review`}
                    detail="Sunday, 4:00 pm WAT, live or replay"
                  >
                    <label className="inline-flex w-fit items-center gap-2 text-[13.5px]">
                      <input
                        type="checkbox"
                        checked={sogp.reviewAttended}
                        disabled={!writable}
                        onChange={(event) => save({ ...record, sogp: { ...sogp, reviewAttended: event.target.checked } })}
                        className="size-4 accent-(--color-brand-blue)"
                      />
                      I joined the review
                    </label>
                  </Task>
                )}
                <Task
                  index={2}
                  done={prayedMorning(record)}
                  icon={HandHeartIcon}
                  title="5:30 am Prayer Watch"
                  detail=""
                >
                  <label className="inline-flex w-fit items-center gap-2 text-[13.5px]">
                    <input
                      type="checkbox"
                      checked={prayedMorning(record)}
                      disabled={!writable}
                      onChange={(event) =>
                        save({
                          ...record,
                          prayerWatch: event.target.checked
                            ? [...record.prayerWatch, "morning"]
                            : record.prayerWatch.filter((session) => session !== "morning"),
                        })
                      }
                      className="size-4 accent-(--color-brand-blue)"
                    />
                    Done
                  </label>
                  
                </Task>
              </ol>
            )}
            {!writable && !future ? null : null}
          </section>
        </div>

        <aside className="grid content-start gap-5">
          <section aria-labelledby="progress" className={cn(panel, "grid gap-4 px-4 py-4")}>
            <h2 id="progress" className="text-[14px] font-medium text-(--color-text-strong)">
              Course progress
            </h2>
            <Meter label="Teachings" value={progress.teachings} total={progress.teachingsTotal} />
            <Meter label="Prayer Watch" value={progress.prayerDays} total={progress.elapsedDays} percent />
            <Meter label="Reviews" value={progress.reviews} total={progress.reviewsTotal} />
          </section>

          <section aria-labelledby="outline" className="grid gap-3">
            <SectionTitle id="outline" title="Course outline" />
            <ol className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
              {SOGP_LEVELS.map((level) => (
                <li key={level.level} className="px-4 py-3">
                  <p className="mb-2 flex items-center justify-between text-[12.5px] font-medium text-(--color-text-strong)">
                    Level {level.level}
                    <span className="font-normal text-(--color-text-muted)">{level.title}</span>
                  </p>
                  <ol className="grid gap-1">
                    {level.tracks.map((track) => (
                      <OutlineTrack
                        key={track.curriculumOrder}
                        track={track}
                        schedule={schedule}
                        selected={selected.track?.curriculumOrder === track.curriculumOrder}
                        onSelect={(day) => {
                          setWeek(day.week);
                          setSelectedKey(day.dateKey);
                        }}
                      />
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <LessonSheet day={lessonDay} onClose={() => setLessonDay(null)} />
    </div>
  );
}

function Task({
  index,
  done,
  icon: Icon,
  title,
  detail,
  children,
}: {
  index: number;
  done: boolean;
  icon: typeof HeadphonesIcon;
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 px-4 py-4 sm:px-5">
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-medium tabular-nums transition-colors",
          done ? "bg-(--color-brand-lime) text-(--color-brand-blue)" : "bg-(--color-brand-blue) text-white",
        )}
      >
        {done ? <CheckIcon className="size-4" strokeWidth={2.5} aria-label="Done" /> : index}
      </span>
      <div className="grid min-w-0 flex-1 gap-2.5">
        <div className="grid gap-0.5">
          <p className="flex items-center gap-2 text-[15px] font-medium text-(--color-text-strong)">
            <Icon className="size-4 text-(--color-text-muted)" strokeWidth={1.75} aria-hidden />
            {title}
          </p>
          <p className="text-[12.5px] text-(--color-text-muted)">{detail}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

function StepChip({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium",
        done ? "bg-(--color-brand-sky) text-(--color-brand-blue)" : "border border-(--color-line-strong) text-(--color-text-muted)",
      )}
    >
      {done ? <CheckIcon className="size-3" aria-hidden /> : <CircleIcon className="size-2.5" aria-hidden />}
      {label}
    </span>
  );
}

function Meter({ label, value, total, percent = false }: { label: string; value: number; total: number; percent?: boolean }) {
  const ratio = total ? Math.min(1, value / total) : 0;
  return (
    <div className="grid gap-1.5">
      <p className="flex items-center justify-between text-[12.5px]">
        <span className="text-(--color-text-muted)">{label}</span>
        <span className="font-medium tabular-nums text-(--color-text-strong)">
          {percent ? `${Math.round(ratio * 100)}%` : `${value}/${total}`}
        </span>
      </p>
      <span className="h-1.5 overflow-hidden rounded-full bg-(--color-surface-muted) ring-1 ring-inset ring-(--color-line)">
        <span className="block h-full rounded-full bg-(--color-brand-blue) transition-[width] duration-300" style={{ width: `${ratio * 100}%` }} />
      </span>
    </div>
  );
}

function OutlineTrack({
  track,
  schedule,
  selected,
  onSelect,
}: {
  track: SogpCurriculumTrack;
  schedule: SogpDay[];
  selected: boolean;
  onSelect: (day: SogpDay) => void;
}) {
  const { state, viewer, today } = useDemo();
  const day = schedule.find((item) => item.track?.curriculumOrder === track.curriculumOrder);
  const released = Boolean(day && day.dateKey <= today);
  const status = day ? dayState(state, viewer.id, day) : "upcoming";
  const done = day ? teachingDone(devotionFor(state, viewer.id, day.dateKey)) : false;

  return (
    <li>
      <button
        type="button"
        disabled={!released || !day}
        onClick={() => day && onSelect(day)}
        className={cn(
          "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-colors disabled:cursor-default",
          focusRing,
          selected ? "bg-(--color-brand-sky-soft) text-(--color-brand-blue)" : "text-(--color-text) enabled:hover:bg-(--color-surface-muted)",
          !released && "text-(--color-text-muted)",
        )}
      >
        <span className="mt-0.5 shrink-0">
          {!released ? (
            <LockIcon className="size-3.5" aria-label="Opens later" />
          ) : done ? (
            <CheckIcon className="size-3.5 text-(--color-brand-blue)" strokeWidth={2.5} aria-label="Done" />
          ) : status === "missed" ? (
            <span className="block size-2.5 translate-y-0.5 rounded-full bg-red-400" aria-label="Missed" />
          ) : (
            <CircleIcon className="size-3.5" aria-label="Open" />
          )}
        </span>
        <span>
          {track.levelPosition}. {track.title}
        </span>
      </button>
    </li>
  );
}

/** Two quick questions from the curriculum itself, so the quiz is interactive without inventing teaching content. */
function quizFor(track: SogpCurriculumTrack) {
  const level = SOGP_LEVELS.find((item) => item.level === track.curriculumLevel)!;
  const others = level.tracks.filter((item) => item.curriculumOrder !== track.curriculumOrder).slice(0, 2);
  const titles = [track.title, ...others.map((item) => item.title)].sort();
  return [
    {
      id: "level",
      prompt: "Which level is this teaching part of?",
      options: SOGP_LEVELS.map((item) => `Level ${item.level}: ${item.title}`),
      answer: `Level ${level.level}: ${level.title}`,
    },
    { id: "title", prompt: "Which teaching did you just open?", options: titles, answer: track.title },
  ];
}

function LessonSheet({ day, onClose }: { day: SogpDay | null; onClose: () => void }) {
  return (
    <Sheet
      open={day !== null}
      onClose={onClose}
      title={day?.track?.title ?? ""}
      description={day?.track ? `Level ${day.track.curriculumLevel} · teaching ${day.track.levelPosition} of 6 · ${longDate(day.dateKey)}` : undefined}
    >
      {day?.track ? <Lesson key={day.dateKey} day={day} track={day.track} onClose={onClose} /> : null}
    </Sheet>
  );
}

function Lesson({ day, track, onClose }: { day: SogpDay; track: SogpCurriculumTrack; onClose: () => void }) {
  const { state, viewer, today, run } = useDemo();
  const record = devotionFor(state, viewer.id, day.dateKey);
  const sogp = record.sogp ?? {
    listened: false,
    quizAttempted: false,
    writtenSubmitted: false,
    reviewAttended: false,
    preparationDone: false,
  };
  const writable = isWritableDay(day.dateKey, today);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const quiz = quizFor(track);
  const score = quiz.filter((question) => answers[question.id] === question.answer).length;

  function save(next: Partial<NonNullable<DayActivity["sogp"]>>) {
    run((current) => updateDevotion(current, viewer.id, day.dateKey, { ...record, sogp: { ...sogp, ...next } }));
  }

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-[14px] font-medium text-(--color-text-strong)">1. Listen</h3>
        <div className="flex items-center gap-3 rounded-xl border border-(--color-line) bg-(--color-surface-muted) px-3 py-3">
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? "Pause the sample" : "Play the sample"}
            className={cn("grid size-10 shrink-0 place-items-center rounded-full bg-(--color-brand-blue) text-white", focusRing)}
          >
            {playing ? <PauseIcon className="size-4" aria-hidden /> : <PlayIcon className="size-4 translate-x-px" aria-hidden />}
          </button>
          <div className="grid flex-1 gap-1.5">
            <span className="h-1 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-(--color-line)">
              <span
                className={cn(
                  "block h-full bg-(--color-brand-blue) transition-[width] ease-linear",
                  playing || sogp.listened ? "w-full duration-[6000ms]" : "w-0 duration-300",
                )}
                onTransitionEnd={() => {
                  if (playing && writable && !sogp.listened) save({ listened: true });
                }}
              />
            </span>
            <span className="text-[12px] text-(--color-text-muted)">
              {sogp.listened ? "Listened" : playing ? "Playing a silent demo sample…" : "Sample player"}
            </span>
          </div>
        </div>
        <label className="inline-flex w-fit items-center gap-2 text-[13.5px]">
          <input
            type="checkbox"
            checked={Boolean(sogp.listened)}
            disabled={!writable}
            onChange={(event) => save({ listened: event.target.checked })}
            className="size-4 accent-(--color-brand-blue)"
          />
          I listened to this teaching
        </label>
      </section>

      <section className="grid gap-3">
        <h3 className="text-[14px] font-medium text-(--color-text-strong)">2. Quiz</h3>
        {quiz.map((question) => (
          <fieldset key={question.id} className="grid gap-2">
            <legend className="mb-1 text-[13.5px] text-(--color-text)">{question.prompt}</legend>
            {question.options.map((option) => {
              const chosen = answers[question.id] === option;
              const right = checked && option === question.answer;
              return (
                <label
                  key={option}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[13px] transition-colors",
                    chosen ? "border-(--color-brand-blue) bg-(--color-brand-sky-soft)" : "border-(--color-line) hover:border-(--color-line-strong)",
                    right && "border-(--color-brand-blue)",
                  )}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option}
                    checked={chosen}
                    disabled={!sogp.listened || checked}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                    className="accent-(--color-brand-blue)"
                  />
                  {option}
                  {right ? <CheckIcon className="ml-auto size-4 text-(--color-brand-blue)" aria-label="Correct" /> : null}
                </label>
              );
            })}
          </fieldset>
        ))}
        {checked ? (
          <p className="text-[13px] text-(--color-text)">
            {score} of {quiz.length} right. 
          </p>
        ) : (
          <button
            type="button"
            className={cn(buttonSecondary, "w-fit")}
            disabled={!sogp.listened || !writable || Object.keys(answers).length < quiz.length}
            onClick={() => {
              setChecked(true);
              save({ quizAttempted: true });
            }}
          >
            Submit quiz
          </button>
        )}
        {!sogp.listened ? <p className="text-[12px] text-(--color-text-muted)">Listen first</p> : null}
      </section>

      

      <div className="flex justify-end">
        <button type="button" className={buttonSmall} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
