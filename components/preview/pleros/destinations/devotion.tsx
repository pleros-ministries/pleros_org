"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpenIcon, EyeIcon, EyeOffIcon, FlameIcon, HeadphonesIcon, LockIcon, SunriseIcon, TrophyIcon } from "lucide-react";

import type { DayActivity, PrayerWatchSession } from "@/lib/community/ministry-report";
import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import { podcastSeries } from "@/lib/podcast-page-content";
import { PODCAST_FOUNDATIONS_DAYS, PODCAST_FOUNDATIONS_PLAN, PODCAST_FOUNDATIONS_TITLE } from "@/lib/podcast-journey";
import { PODCAST_LEADERBOARD_POINTS, buildPodcastLeaderboard, type PodcastLeaderboardListener } from "@/lib/podcast-leaderboard";
import { shiftDate } from "@/lib/sogp/daily-date";
import { cn } from "@/lib/utils";
import { devotionFor, isWritableDay } from "@/lib/preview/pleros/daily-report";
import { seeded } from "@/lib/preview/pleros/fixtures";
import { updateDevotion } from "@/lib/preview/pleros/store";
import type { DemoState } from "@/lib/preview/pleros/types";

import { useDemo } from "../demo-context";
import { Badge, DayTracker, PageHeader, StatStrip, buttonPrimary, buttonSecondary, focusRing, longDate, panel, relativeDay, shortDate } from "../ui";
import { useTrackerWindow } from "../use-tracker";
import { ExternalLink, Field, ListPanel, Row, Section, Tick, fieldControl, monthLabel, selectControl } from "./parts";

// ─── Shared ────────────────────────────────────────────────────────────────

const SESSIONS: ReadonlyArray<{ key: Exclude<PrayerWatchSession, "unspecified">; label: string; time: string }> = [
  { key: "morning", label: "Morning", time: "5:30 am" },
  { key: "afternoon", label: "Afternoon", time: "12:30 pm" },
  { key: "evening", label: "Evening", time: "8:30 pm" },
];

function monthDays(state: DemoState, personId: string): Array<[string, DayActivity]> {
  const month = state.today.slice(0, 7);
  return Object.entries(state.devotion[personId] ?? {}).filter(([dateKey]) => dateKey.startsWith(month) && dateKey <= state.today);
}

function useSaveDevotion() {
  const { run, viewer } = useDemo();
  return (dateKey: string, next: DayActivity) => run((current) => updateDevotion(current, viewer.id, dateKey, next));
}

function ViewOnlyNote() {
  return (
    <p className="flex items-center gap-2 text-[13px] text-(--color-text-muted)">
      <LockIcon className="size-3.5 shrink-0" aria-hidden />
      View only.
    </p>
  );
}

// ─── Prayer Watch and Bible reading ───────────────────────────────────────

export function PrayerWatchDestination() {
  const { state, viewer, day, today, setDay } = useDemo();
  const tracker = useTrackerWindow(day, today);
  const save = useSaveDevotion();
  const record = devotionFor(state, viewer.id, day);
  const writable = isWritableDay(day, today);
  const month = monthDays(state, viewer.id);

  function toggleSession(session: (typeof SESSIONS)[number]["key"]) {
    const has = record.prayerWatch.includes(session);
    save(day, { ...record, prayerWatch: has ? record.prayerWatch.filter((item) => item !== session) : [...record.prayerWatch, session] });
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={longDate(day)} title="Prayer Watch & Bible reading" />

      <StatStrip
        items={[
          { label: "Prayer days", value: month.filter(([, entry]) => entry.prayerWatch.length > 0).length, detail: monthLabel(today) },
          { label: "Morning sessions", value: month.filter(([, entry]) => entry.prayerWatch.includes("morning")).length, detail: monthLabel(today) },
          { label: "Chapters read", value: month.reduce((sum, [, entry]) => sum + (entry.bible?.chapters ?? 0), 0), detail: monthLabel(today) },
          { label: "Reading days", value: month.filter(([, entry]) => entry.bible).length, detail: monthLabel(today) },
        ]}
      />

      <div className={cn(panel, "px-1 py-2 sm:px-3 sm:py-2.5")}>
        <DayTracker
          days={tracker.days}
          selected={day}
          today={today}
          onSelect={setDay}
          onShift={tracker.shift}
          canShiftBack={tracker.canShiftBack}
          writable={(key) => isWritableDay(key, today)}
          label="Prayer days"
          describe={(key) => `${devotionFor(state, viewer.id, key).prayerWatch.length} sessions`}
          renderMark={(key) => {
            const sessions = devotionFor(state, viewer.id, key).prayerWatch;
            return (
              <span aria-hidden className="flex gap-0.5">
                {SESSIONS.map((session) => (
                  <span key={session.key} className={cn("size-1.5 rounded-full", sessions.includes(session.key) ? "bg-(--color-brand-blue)" : "bg-(--color-line-strong)")} />
                ))}
              </span>
            );
          }}
        />
      </div>

      {!writable ? <ViewOnlyNote /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Prayer Watch" detail={relativeDay(day, today)}>
          <ol className={cn(panel, "grid grid-cols-3 divide-x divide-(--color-line) overflow-hidden")}>
            {SESSIONS.map((session) => {
              const attended = record.prayerWatch.includes(session.key);
              return (
                <li key={session.key} className={cn("grid justify-items-center gap-2 px-2 py-4 text-center", attended && "bg-(--color-brand-sky-soft)")}>
                  <span className="text-[12px] font-medium text-(--color-text-muted)">{session.label}</span>
                  <span className="text-[15px] font-medium tabular-nums text-(--color-text-strong)">{session.time}</span>
                  <Tick done={attended} label={`${session.label} Prayer Watch attended`} onToggle={writable ? () => toggleSession(session.key) : undefined} />
                </li>
              );
            })}
          </ol>
          <p className="text-[12px] text-(--color-text-muted)">Morning attendance counts towards SOGP.</p>
        </Section>

        <Section title="Bible reading" detail={record.bible ? `${record.bible.book} ${record.bible.chapter} · ${record.bible.chapters} ch` : "Nothing recorded"}>
          <BibleReadingForm key={day} record={record} writable={writable} onSave={(bible) => save(day, { ...record, bible })} />
        </Section>
      </div>
    </div>
  );
}

function BibleReadingForm({
  record,
  writable,
  onSave,
}: {
  record: DayActivity;
  writable: boolean;
  onSave: (bible: DayActivity["bible"]) => void;
}) {
  const [book, setBook] = useState(record.bible?.book ?? "John");
  const [chapter, setChapter] = useState(String(record.bible?.chapter ?? 1));
  const [chapters, setChapters] = useState(String(record.bible?.chapters ?? 1));
  const bookChapters = getBibleBook(book)?.chapters ?? 1;

  return (
    <form
      className={cn(panel, "grid gap-4 p-4 sm:p-5")}
      onSubmit={(event) => {
        event.preventDefault();
        const read = Number(chapters);
        onSave(read > 0 ? { book, chapter: Math.min(bookChapters, Math.max(1, Number(chapter) || 1)), chapters: read } : null);
      }}
    >
      <Field label="Book">
        <select className={selectControl} value={book} disabled={!writable} onChange={(event) => setBook(event.target.value)}>
          {(["Old Testament", "New Testament"] as const).map((testament) => (
            <optgroup key={testament} label={testament}>
              {BIBLE_BOOKS.filter((item) => item.testament === testament).map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Reached chapter">
          <input className={fieldControl} type="number" inputMode="numeric" min={1} max={bookChapters} value={chapter} disabled={!writable} onChange={(event) => setChapter(event.target.value)} />
        </Field>
        <Field label="Chapters read">
          <input className={fieldControl} type="number" inputMode="numeric" min={0} max={150} value={chapters} disabled={!writable} onChange={(event) => setChapters(event.target.value)} />
        </Field>
      </div>
      <button type="submit" className={cn(buttonPrimary, "w-fit")} disabled={!writable}>Save</button>
    </form>
  );
}

// ─── Podcast ──────────────────────────────────────────────────────────────

/** Part counts for the Foundations plan, as published in each series. */
const SERIES_PARTS: Record<string, number> = {
  "The Place of the Gospel in Your Life": 4,
  "The Reality of God's Purpose": 12,
  "The Pursuit of God's Purpose": 12,
};

const FOUNDATIONS_EPISODES = PODCAST_FOUNDATIONS_PLAN.flatMap((item) =>
  Array.from({ length: item.parts ?? SERIES_PARTS[item.title] ?? 1 }, (_, index) => ({ series: item.title, part: index + 1 })),
).slice(0, PODCAST_FOUNDATIONS_DAYS);

/** The demo journey started nine days ago, so today is Day 10. */
function journeyStart(today: string) {
  return shiftDate(today, -9);
}

export function PodcastDestination() {
  const { state, viewer, today, href } = useDemo();
  const save = useSaveDevotion();
  const start = journeyStart(today);
  const days = FOUNDATIONS_EPISODES.map((episode, index) => {
    const dateKey = shiftDate(start, index);
    const listened = devotionFor(state, viewer.id, dateKey).podcastEpisodes > 0;
    return { ...episode, day: index + 1, dateKey, listened };
  });
  const current = days.find((item) => item.dateKey === today) ?? days[0]!;
  const listenedCount = days.filter((item) => item.listened).length;
  const todayRecord = devotionFor(state, viewer.id, today);

  function toggleEpisode(dateKey: string) {
    const record = devotionFor(state, viewer.id, dateKey);
    save(dateKey, { ...record, podcastEpisodes: record.podcastEpisodes > 0 ? 0 : 1 });
  }

  function toggleMorning() {
    const has = todayRecord.prayerWatch.includes("morning");
    save(today, { ...todayRecord, prayerWatch: has ? todayRecord.prayerWatch.filter((item) => item !== "morning") : [...todayRecord.prayerWatch, "morning"] });
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${PODCAST_FOUNDATIONS_TITLE} · day ${current.day} of ${PODCAST_FOUNDATIONS_DAYS}`}
        title="Podcast"
        actions={<Link href={href("destinations/podcast-leaderboard")} className={buttonSecondary}><TrophyIcon className="size-3.5" aria-hidden />Leaderboard</Link>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid content-start gap-6">
          <Section title="Today" detail={longDate(today)}>
            <ListPanel>
              <Row
                icon={HeadphonesIcon}
                title={`${current.series}, part ${current.part}`}
                detail={`Episode · day ${current.day}`}
                trailing={<Tick done={current.listened} label="Mark episode as listened" onToggle={() => toggleEpisode(current.dateKey)} />}
              />
              <Row
                icon={SunriseIcon}
                title="Morning Prayer Watch"
                detail="5:30 am"
                trailing={<Tick done={todayRecord.prayerWatch.includes("morning")} label="Mark morning Prayer Watch attended" onToggle={toggleMorning} />}
              />
            </ListPanel>
          </Section>

          <Section title="Your journey" detail={`${listenedCount} of ${PODCAST_FOUNDATIONS_DAYS} listened`}>
            <ol className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
              {days.map((item) => {
                const future = item.dateKey > today;
                const missed = !future && !item.listened && item.dateKey < today;
                const writable = isWritableDay(item.dateKey, today);
                return (
                  <li key={item.day} className={cn("flex items-center gap-3 px-4 py-2.5 sm:px-5", item.dateKey === today && "bg-(--color-brand-sky-soft)")}>
                    <span className={cn("w-12 shrink-0 text-[12px] font-medium tabular-nums", missed ? "text-red-700" : "text-(--color-text-muted)")}>Day {item.day}</span>
                    <span className="grid min-w-0 flex-1">
                      <span className={cn("truncate text-[13.5px]", future ? "text-(--color-text-muted)" : "text-(--color-text-strong)")}>{item.series}, part {item.part}</span>
                      <span className="text-[11.5px] text-(--color-text-muted)">{shortDate(item.dateKey)}{missed ? " · missed, still open" : ""}</span>
                    </span>
                    {future ? (
                      <LockIcon className="size-3.5 text-(--color-text-muted)" aria-label="Opens on its day" />
                    ) : (
                      <Tick done={item.listened} label={`Day ${item.day} listened`} onToggle={writable ? () => toggleEpisode(item.dateKey) : undefined} />
                    )}
                  </li>
                );
              })}
            </ol>
          </Section>
        </div>

        <aside className="grid content-start gap-6">
          <Section title="Journey">
            <div className={cn(panel, "grid gap-2 p-4")}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13.5px] font-medium text-(--color-text-strong)">{PODCAST_FOUNDATIONS_TITLE}</p>
                <Badge tone="blue">Recommended</Badge>
              </div>
              <p className="text-[12.5px] leading-snug text-(--color-text-muted)">
                {PODCAST_FOUNDATIONS_PLAN.map((item) => item.title).join(" · ")}
              </p>
            </div>
          </Section>
          <Section title="Series">
            <ListPanel>
              {podcastSeries.map((series) => (
                <li key={series.id} className="grid gap-1 px-4 py-3">
                  <span className="text-[13px] font-medium text-(--color-text-strong)">{series.title}</span>
                  <span className="text-[12px] leading-snug text-(--color-text-muted)">{series.description}</span>
                  {series.href ? <ExternalLink href={series.href}>Listen</ExternalLink> : <span className="text-[12px] text-(--color-text-muted)">Coming soon</span>}
                </li>
              ))}
            </ListPanel>
          </Section>
        </aside>
      </div>
    </div>
  );
}

// ─── Podcast leaderboard ──────────────────────────────────────────────────

export function PodcastLeaderboardDestination() {
  const { state, viewer, today } = useDemo();
  // Opt-in and off by default; the choice lives in this tab only.
  const [visible, setVisible] = useState(false);
  const listeners: PodcastLeaderboardListener[] = state.people.map((person) => {
    const days = monthDays(state, person.id);
    const listening = days.filter(([, entry]) => entry.podcastEpisodes > 0).map(([dateKey]) => dateKey);
    return {
      userId: person.id,
      name: person.firstName,
      listeningDays: listening.length,
      prayerWatch: days.filter(([, entry]) => entry.prayerWatch.includes("morning")).length,
      activityDays: listening,
      visible: seeded(`${person.id}:podcast-board`) > 0.3,
    };
  });
  const board = buildPodcastLeaderboard({ listeners, viewerId: viewer.id, viewerVisible: visible, todayKey: today });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={`Resets monthly · ${board.monthLabel}`} title="Podcast leaderboard" />

      {board.me ? (
        <section className={cn(panel, "grid gap-4 p-4 sm:p-5")} aria-label="Your score">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-0.5">
              <p className="text-[12.5px] text-(--color-text-muted)">{visible ? "Your rank" : "Your private rank"}</p>
              <p className="text-[22px] font-medium tabular-nums text-(--color-text-strong)">#{board.me.rank} · {board.me.points} pts</p>
            </div>
            <button type="button" aria-pressed={visible} onClick={() => setVisible((value) => !value)} className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-full border border-(--color-line-strong) bg-white px-3 text-[12.5px] font-medium text-(--color-text-strong) hover:border-(--color-brand-blue)", focusRing)}>
              {visible ? <EyeIcon className="size-3.5" aria-hidden /> : <EyeOffIcon className="size-3.5" aria-hidden />}
              {visible ? "Shown on the board" : "Hidden from the board"}
            </button>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["Listening", board.me.breakdown.listening],
              ["Prayer Watch", board.me.breakdown.prayer],
              ["Streak bonus", board.me.breakdown.streak],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[var(--radius-sm)] bg-(--color-surface-muted) px-2 py-2">
                <dt className="text-[11.5px] text-(--color-text-muted)">{label}</dt>
                <dd className="text-[15px] font-medium tabular-nums text-(--color-text-strong)">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-[12px] text-(--color-text-muted)">
            {PODCAST_LEADERBOARD_POINTS.listeningDay} points per listening day, {PODCAST_LEADERBOARD_POINTS.prayerWatch} per morning Prayer Watch, plus a bonus every seven-day streak.
          </p>
        </section>
      ) : (
        <p className="text-[13px] text-(--color-text-muted)">Mark an episode this month to get a score.</p>
      )}

      <Section title="This month" detail={`${board.top.length} listeners shown`}>
        <ol className={cn(panel, "divide-y divide-(--color-line) overflow-hidden")}>
          {board.top.map((entry) => (
            <li key={`${entry.rank}-${entry.name}`} className={cn("flex items-center gap-3 px-4 py-2.5 sm:px-5", entry.isMe && "bg-(--color-brand-sky-soft)")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-medium tabular-nums", entry.rank <= 3 ? "bg-(--color-brand-lime) text-(--color-brand-blue)" : "bg-(--color-surface-muted) text-(--color-text-muted)")}>{entry.rank}</span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-(--color-text-strong)">{entry.name}{entry.isMe ? " (you)" : ""}</span>
              {entry.currentStreak > 1 ? (
                <span className="inline-flex items-center gap-0.5 text-[12px] text-(--color-text-muted)"><FlameIcon className="size-3.5" aria-hidden />{entry.currentStreak}</span>
              ) : null}
              <span className="w-14 text-right text-[13px] font-medium tabular-nums text-(--color-brand-blue)">{entry.points}</span>
            </li>
          ))}
        </ol>
      </Section>
      <p className="flex items-center gap-1.5 text-[12px] text-(--color-text-muted)"><BookOpenIcon className="size-3.5" aria-hidden />First names only. Scores come from this demo&apos;s synthetic month.</p>
    </div>
  );
}
