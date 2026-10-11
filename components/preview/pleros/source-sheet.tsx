"use client";

import { useState } from "react";

import { ToggleChip } from "@/components/community/report/choice-chips";
import { inputClass } from "@/components/community/report/styles";
import type { ActivityLine, DayActivity, PrayerWatchSession } from "@/lib/community/ministry-report";
import { updateDevotion } from "@/lib/preview/pleros/store";

import { useDemo } from "./demo-context";
import { SOURCE_NAMES } from "./report-parts";
import { Sheet, buttonPrimary, buttonSecondary, shortDate } from "./ui";

const SESSIONS: Array<{ key: Exclude<PrayerWatchSession, "unspecified">; label: string }> = [
  { key: "morning", label: "Morning · 5:30 am" },
  { key: "afternoon", label: "Afternoon · 12:30 pm" },
  { key: "evening", label: "Evening · 8:30 pm" },
];



/**
 * The preview stand-in for one canonical devotion source. Saving here edits
 * that source's record; the devotional report only ever reads it, so nothing
 * is entered twice.
 */
export function SourceSheet({
  source,
  dateKey,
  record,
  onClose,
}: {
  source: ActivityLine["key"] | null;
  dateKey: string;
  record: DayActivity;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={source !== null}
      onClose={onClose}
      title={source ? SOURCE_NAMES[source] : ""}
      description={shortDate(dateKey)}
    >
      {source ? (
        <SourceForm key={`${source}-${dateKey}`} source={source} dateKey={dateKey} record={record} onClose={onClose} />
      ) : null}
    </Sheet>
  );
}

function SourceForm({
  source,
  dateKey,
  record,
  onClose,
}: {
  source: ActivityLine["key"];
  dateKey: string;
  record: DayActivity;
  onClose: () => void;
}) {
  const { run, viewer } = useDemo();
  const [draft, setDraft] = useState<DayActivity>(record);
  const [chapters, setChapters] = useState(String(record.bible?.chapters ?? ""));
  const [chapterAt, setChapterAt] = useState(String(record.bible?.chapter ?? ""));

  function save() {
    const next: DayActivity = { ...draft };
    if (source === "bible") {
      const count = Number(chapters);
      next.bible =
        Number.isInteger(count) && count > 0
          ? {
              chapters: count,
              book: record.bible?.book ?? "John",
              chapter: Math.max(1, Number(chapterAt) || record.bible?.chapter || 1),
            }
          : null;
    }
    const outcome = run((state) => updateDevotion(state, viewer.id, dateKey, next));
    if (outcome.ok) onClose();
  }

  const sogp = draft.sogp;

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      {source === "prayerWatch" ? (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[13px] font-medium text-(--color-text)">Sessions you joined</legend>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((session) => (
              <ToggleChip
                key={session.key}
                label={session.label}
                checked={draft.prayerWatch.includes(session.key)}
                onChange={(checked) =>
                  setDraft((current) => ({
                    ...current,
                    prayerWatch: checked
                      ? [...current.prayerWatch, session.key]
                      : current.prayerWatch.filter((item) => item !== session.key),
                  }))
                }
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {source === "bible" ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-[13px] font-medium text-(--color-text)">
            Chapters read
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={150}
              value={chapters}
              onChange={(event) => setChapters(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-[13px] font-medium text-(--color-text)">
            Now at {record.bible?.book ?? "John"}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={150}
              value={chapterAt}
              onChange={(event) => setChapterAt(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      ) : null}

      {source === "podcast" ? (
        <label className="grid max-w-[200px] gap-1 text-[13px] font-medium text-(--color-text)">
          Episodes listened to
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            value={draft.podcastEpisodes}
            onChange={(event) =>
              setDraft((current) => ({ ...current, podcastEpisodes: Number(event.target.value) || 0 }))
            }
            className={inputClass}
          />
        </label>
      ) : null}

      {source === "sogp" && sogp ? (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[13px] font-medium text-(--color-text)">What you did in SOGP</legend>
          <div className="flex flex-wrap gap-2">
            {sogp.listened !== null ? (
              <>
                <ToggleChip
                  label="Listened to the teaching"
                  checked={Boolean(sogp.listened)}
                  onChange={(checked) =>
                    setDraft((current) => ({ ...current, sogp: { ...current.sogp!, listened: checked } }))
                  }
                />
                <ToggleChip
                  label="Took the quiz"
                  checked={sogp.quizAttempted}
                  onChange={(checked) =>
                    setDraft((current) => ({ ...current, sogp: { ...current.sogp!, quizAttempted: checked } }))
                  }
                />
                <ToggleChip
                  label="Sent the written response"
                  checked={sogp.writtenSubmitted}
                  onChange={(checked) =>
                    setDraft((current) => ({ ...current, sogp: { ...current.sogp!, writtenSubmitted: checked } }))
                  }
                />
              </>
            ) : (
              <ToggleChip
                label="Joined the live review"
                checked={sogp.reviewAttended}
                onChange={(checked) =>
                  setDraft((current) => ({ ...current, sogp: { ...current.sogp!, reviewAttended: checked } }))
                }
              />
            )}
          </div>
        </fieldset>
      ) : null}

      

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={buttonSecondary}>
          Cancel
        </button>
        <button type="submit" className={buttonPrimary}>
          Save
        </button>
      </div>
    </form>
  );
}
