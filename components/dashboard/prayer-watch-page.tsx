"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import {
  saveBibleReadingLogAction,
  togglePrayerWatchAttendanceAction,
} from "@/app/_actions/prayer-watch-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BIBLE_BOOKS,
  buildBibleReadingProjection,
  getBibleBook,
} from "@/lib/bible-reading";
import {
  buildPrayerWatchCalendar,
  getMonthLabel,
  PRAYER_WATCH_YOUTUBE_URL,
  type PrayerWatchCalendarCell,
} from "@/lib/prayer-watch";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const INITIAL_TOGGLE_STATE = { error: null as string | null };
const INITIAL_READING_STATE = { error: null as string | null };

function formatDialogDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function cellClasses(cell: PrayerWatchCalendarCell): string {
  if (!cell.inCurrentMonth) {
    return "pointer-events-none border-transparent bg-transparent";
  }

  if (cell.state === "attended") {
    return "border-transparent bg-[var(--color-brand-green)] text-white hover:brightness-95";
  }

  if (cell.state === "future") {
    return "border-transparent bg-[rgba(6,16,86,0.03)] text-[rgba(6,16,86,0.28)]";
  }

  return "border-transparent bg-[rgba(6,16,86,0.06)] text-[var(--color-text-muted)] hover:bg-[rgba(6,16,86,0.1)]";
}

function ToggleAttendanceButton({ isUndo }: { isUndo: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving..." : isUndo ? "Undo log" : "Log attendance"}
    </Button>
  );
}

function SaveBibleReadingButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving..." : "Save Bible reading"}
    </Button>
  );
}

function BibleReadingProjectionFootnote({
  text,
}: {
  text: string | null;
}) {
  return (
    <p className="border-t border-[rgba(6,16,86,0.1)] pt-3 font-[var(--font-be-vietnam-pro)] text-[0.75rem] leading-[1.45] text-[var(--color-text-muted)]">
      {text ?? "Log your Bible reading to see your projected completion date."}
    </p>
  );
}

type BibleReadingLog = {
  dateKey: string;
  chaptersRead: number;
  currentBook: string;
  currentChapter: number;
};

type PrayerWatchPageProps = {
  year: number;
  month: number;
  todayKey: string;
  attendedDateKeys: string[];
  bibleReadingLogs: BibleReadingLog[];
};

export function PrayerWatchPage({
  year,
  month,
  todayKey,
  attendedDateKeys,
  bibleReadingLogs,
}: PrayerWatchPageProps) {
  const weeks = buildPrayerWatchCalendar({ year, month, attendedDateKeys, todayKey });
  const cells = weeks.flat();
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"prayer" | "bible">("prayer");
  const [chaptersRead, setChaptersRead] = useState("1");
  const [currentBook, setCurrentBook] = useState("Matthew");
  const [currentChapter, setCurrentChapter] = useState("1");
  const selectedCell = selectedDateKey
    ? (cells.find((cell) => cell.dateKey === selectedDateKey) ?? null)
    : null;
  const [actionState, formAction] = useActionState(
    togglePrayerWatchAttendanceAction,
    INITIAL_TOGGLE_STATE,
  );
  const [readingActionState, readingFormAction] = useActionState(
    saveBibleReadingLogAction,
    INITIAL_READING_STATE,
  );
  const selectedBook = getBibleBook(currentBook);
  const projectionLogs = selectedDateKey
    ? [
        ...bibleReadingLogs.filter((log) => log.dateKey !== selectedDateKey),
        {
          dateKey: selectedDateKey,
          chaptersRead: Number(chaptersRead) || 0,
        },
      ]
    : bibleReadingLogs;
  const projection =
    selectedDateKey && selectedBook
      ? buildBibleReadingProjection({
          asOfDateKey: selectedDateKey,
          currentBook,
          currentChapter: Number(currentChapter) || 1,
          logs: projectionLogs,
        })
      : null;

  function openDate(dateKey: string) {
    const readingLog = bibleReadingLogs.find((log) => log.dateKey === dateKey);
    setActiveTab("prayer");
    setChaptersRead(`${readingLog?.chaptersRead ?? 1}`);
    setCurrentBook(readingLog?.currentBook ?? "Matthew");
    setCurrentChapter(`${readingLog?.currentChapter ?? 1}`);
    setSelectedDateKey(dateKey);
  }

  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6">
      <div className="container-pleros grid max-w-[36rem] gap-8">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-blue)]"
        >
          <ChevronLeftIcon className="size-4" />
          Back to dashboard
        </Link>

        <div className="grid gap-2">
          <h1 className="site-hero-heading max-w-[13ch] text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            Prayer Watch
          </h1>
          <p className="font-[var(--font-be-vietnam-pro)] max-w-[34ch] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
            Log the days you join Prayer Watch live, and catch up on any watch
            you missed.
          </p>
        </div>

        <div className="rounded-[1.25rem] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="site-pathway-title text-[1.15rem] text-[var(--color-brand-blue)] sm:text-[1.3rem]">
              {getMonthLabel(year, month)}
            </p>
            <span className="rounded-full bg-[var(--page-accent-soft)] px-3 py-1 text-[0.75rem] font-medium text-[var(--color-brand-blue)]">
              {attendedDateKeys.length} day{attendedDateKeys.length === 1 ? "" : "s"} logged
            </span>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-center sm:gap-2.5">
            {WEEKDAY_LABELS.map((label) => (
              <span
                key={label}
                className="text-[0.6875rem] font-medium uppercase tracking-[0.04em] text-[var(--color-text-muted)]"
              >
                {label.slice(0, 3)}
              </span>
            ))}

            {cells.map((cell) => (
              <button
                key={cell.dateKey}
                type="button"
                disabled={!cell.inCurrentMonth || cell.state === "future"}
                onClick={() => openDate(cell.dateKey)}
                aria-label={`${cell.dateKey}: ${cell.state}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-[var(--radius-sm)] border text-[0.8125rem] font-medium transition-colors disabled:cursor-not-allowed",
                  cell.isToday && "ring-2 ring-[var(--color-brand-blue)] ring-offset-1",
                  cellClasses(cell),
                )}
              >
                {cell.inCurrentMonth ? cell.day : ""}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-[0.75rem] text-[var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[0.2rem] bg-[var(--color-brand-green)]" />
              Attended
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[0.2rem] bg-[rgba(6,16,86,0.06)]" />
              Missed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[0.2rem] bg-[rgba(6,16,86,0.03)]" />
              Upcoming
            </span>
          </div>
        </div>
      </div>

      <Dialog
        open={selectedCell !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDateKey(null);
          }
        }}
      >
        <DialogContent>
          {selectedCell ? (
            <>
              <DialogHeader>
                <DialogTitle>{formatDialogDate(selectedCell.dateKey)}</DialogTitle>
                <DialogDescription>
                  Log your Prayer Watch attendance or Bible reading for this day.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-sm)] border border-[rgba(6,16,86,0.12)] bg-[rgba(6,16,86,0.04)] p-1">
                {[
                  ["prayer", "Prayer"],
                  ["bible", "Bible reading"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setActiveTab(value as "prayer" | "bible")}
                    className={cn(
                      "rounded-[calc(var(--radius-sm)-2px)] px-3 py-2 text-[0.8125rem] font-semibold transition-colors",
                      activeTab === value
                        ? "bg-white text-[var(--color-brand-blue)] shadow-[var(--shadow-sm)]"
                        : "text-[var(--color-text-muted)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "prayer" ? (
                <form action={formAction}>
                  <input type="hidden" name="date" value={selectedCell.dateKey} />
                  <input
                    type="hidden"
                    name="attended"
                    value={selectedCell.state === "attended" ? "true" : "false"}
                  />
                  <div className="grid gap-4">
                    <p className="font-[var(--font-be-vietnam-pro)] text-[0.875rem] leading-[1.45] text-[var(--color-text-muted)]">
                      {selectedCell.state === "attended"
                        ? "You logged your attendance for this Prayer Watch."
                        : "Did you join Prayer Watch live on this day?"}
                    </p>
                    <DialogFooter>
                      <ToggleAttendanceButton isUndo={selectedCell.state === "attended"} />
                      {selectedCell.state !== "attended" ? (
                        <Button
                          variant="secondary"
                          render={
                            <a
                              href={PRAYER_WATCH_YOUTUBE_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                            />
                          }
                        >
                          Pray with recorded stream
                        </Button>
                      ) : null}
                    </DialogFooter>
                  </div>
                  {actionState.error ? (
                    <p className="mt-2 text-[0.75rem] text-[var(--destructive)]">
                      {actionState.error}
                    </p>
                  ) : null}
                </form>
              ) : (
                <form action={readingFormAction} className="grid gap-4">
                  <input type="hidden" name="date" value={selectedCell.dateKey} />
                  <label className="grid gap-1.5">
                    <span className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] font-semibold text-[var(--color-brand-blue)]">
                      Chapters read
                    </span>
                    <Input
                      name="chaptersRead"
                      type="number"
                      min={1}
                      max={150}
                      value={chaptersRead}
                      onChange={(event) => setChaptersRead(event.target.value)}
                    />
                  </label>

                  <label className="grid gap-1.5">
                    <span className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] font-semibold text-[var(--color-brand-blue)]">
                      Current book
                    </span>
                    <select
                      name="currentBook"
                      value={currentBook}
                      onChange={(event) => {
                        setCurrentBook(event.target.value);
                        setCurrentChapter("1");
                      }}
                      className="h-10 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white px-3 font-[var(--font-be-vietnam-pro)] text-[0.875rem] text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-brand-blue)]"
                    >
                      {BIBLE_BOOKS.map((book) => (
                        <option key={book.name} value={book.name}>
                          {book.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1.5">
                    <span className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] font-semibold text-[var(--color-brand-blue)]">
                      Current chapter
                    </span>
                    <Input
                      name="currentChapter"
                      type="number"
                      min={1}
                      max={selectedBook?.chapters ?? 150}
                      value={currentChapter}
                      onChange={(event) => setCurrentChapter(event.target.value)}
                    />
                  </label>

                  <BibleReadingProjectionFootnote text={projection?.footnote ?? null} />

                  <DialogFooter>
                    <SaveBibleReadingButton />
                  </DialogFooter>
                  {readingActionState.error ? (
                    <p className="text-[0.75rem] text-[var(--destructive)]">
                      {readingActionState.error}
                    </p>
                  ) : null}
                </form>
              )}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
