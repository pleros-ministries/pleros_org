"use client";

import { useActionState, useState } from "react";

import {
  INITIAL_REMINDER_ACTION_STATE,
  REMINDER_FORM_FIELDS,
  type ReminderFormAction,
  type ReminderSetupView,
} from "@/lib/notifications/reminder-preferences";
import {
  LAGOS_TIME_ZONE,
  convertClock,
  formatClock,
  getZonedParts,
} from "@/lib/notifications/zoned-time";
import {
  PRAYER_WATCH_SESSIONS,
  type PrayerWatchSessionId,
} from "@/lib/prayer-watch";
import { cn } from "@/lib/utils";

import {
  SETUP_ERROR,
  SETUP_HELPER,
  SETUP_LABEL,
  SETUP_NOTE,
  SETUP_PRIMARY_BUTTON,
  SETUP_SUCCESS,
} from "./styles";

const PRAYER_WATCH_FIELDS: Record<PrayerWatchSessionId, string> = {
  morning: REMINDER_FORM_FIELDS.prayerWatchMorning,
  afternoon: REMINDER_FORM_FIELDS.prayerWatchAfternoon,
  evening: REMINDER_FORM_FIELDS.prayerWatchEvening,
};

/** "6:30 am your time", for a learner whose clock differs from Lagos. */
function localSessionTime(
  sessionMinutes: number,
  timeZone: string | null,
  lagosDateKey: string,
) {
  if (!timeZone || timeZone === LAGOS_TIME_ZONE) return null;
  const local = convertClock(
    sessionMinutes,
    LAGOS_TIME_ZONE,
    timeZone,
    lagosDateKey,
  );
  if (local.dayShift === 0 && local.minutes === sessionMinutes) return null;
  const day =
    local.dayShift > 0
      ? ", next day"
      : local.dayShift < 0
        ? ", previous day"
        : "";
  return `${formatClock(local.minutes)} your time${day}`;
}

function ReminderCheckbox({
  name,
  label,
  helper,
  checked,
  disabled,
  onChange,
}: {
  name: string;
  label: string;
  helper?: string | null;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-brand-blue)]"
      />
      <span className="grid min-w-0 gap-0.5">
        <span>{label}</span>
        {helper ? <span className={SETUP_HELPER}>{helper}</span> : null}
      </span>
    </label>
  );
}

/** Step 4: which reminders the learner wants. */
export function RemindersStep({
  view,
  timeZone,
  hasPushOnAnyDevice,
  action,
  preview,
}: {
  view: ReminderSetupView;
  /** The browser's zone; null until it is known. */
  timeZone: string | null;
  hasPushOnAnyDevice: boolean;
  action: ReminderFormAction;
  preview: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_REMINDER_ACTION_STATE,
  );
  // Controlled, so the ticks stay put when the form resets after a save.
  const [choices, setChoices] = useState(view.choices);
  // Saving a first teaching time (step 3) switches this reminder on, so it
  // follows the saved value until the learner changes it here themselves.
  const [teachingReminder, setTeachingReminder] = useState<boolean | null>(
    null,
  );
  // Only used to show Prayer Watch in the learner's own time; read once.
  const [lagosDateKey] = useState(
    () => getZonedParts(new Date(), LAGOS_TIME_ZONE).dateKey,
  );

  const hasTeachingTime = view.teachingTimeMinutes !== null;

  return (
    <form action={formAction} className="grid gap-5">
      <input
        type="hidden"
        name={REMINDER_FORM_FIELDS.timeZone}
        value={timeZone ?? view.timeZone}
      />

      <fieldset className="grid gap-2.5">
        <legend className={cn(SETUP_LABEL, "mb-2.5")}>Prayer Watch</legend>
        {PRAYER_WATCH_SESSIONS.map((session) => (
          <ReminderCheckbox
            key={session.id}
            name={PRAYER_WATCH_FIELDS[session.id]}
            label={`${session.label}, ${session.time}`}
            helper={localSessionTime(
              session.hour * 60 + session.minute,
              timeZone,
              lagosDateKey,
            )}
            checked={choices.prayerWatch[session.id]}
            disabled={preview}
            onChange={(checked) =>
              setChoices((current) => ({
                ...current,
                prayerWatch: { ...current.prayerWatch, [session.id]: checked },
              }))
            }
          />
        ))}
        <p className={SETUP_HELPER}>
          Lagos time. We remind you ten minutes before each session you choose.
        </p>
      </fieldset>

      <fieldset className="grid gap-2.5">
        <legend className={cn(SETUP_LABEL, "mb-2.5")}>SOGP teaching</legend>
        <ReminderCheckbox
          name={REMINDER_FORM_FIELDS.teachingReminder}
          label={
            hasTeachingTime
              ? `SOGP teaching at ${formatClock(view.teachingTimeMinutes!)}`
              : "SOGP teaching at your chosen time"
          }
          helper={hasTeachingTime ? null : "Choose a time in step 3 first."}
          checked={
            hasTeachingTime &&
            (teachingReminder ?? view.choices.teachingReminderEnabled)
          }
          disabled={preview || !hasTeachingTime}
          onChange={setTeachingReminder}
        />
      </fieldset>

      <fieldset className="grid gap-2.5">
        <legend className={cn(SETUP_LABEL, "mb-2.5")}>
          Personalised notifications
        </legend>
        <ReminderCheckbox
          name={REMINDER_FORM_FIELDS.community}
          label="Messages, replies and community updates"
          helper="Private messages, Ask Pleros replies, discipleship and Pleros updates."
          checked={choices.communityEnabled}
          disabled={preview}
          onChange={(checked) =>
            setChoices((current) => ({ ...current, communityEnabled: checked }))
          }
        />
        <ReminderCheckbox
          name={REMINDER_FORM_FIELDS.progressNudges}
          label="Evening nudge when today's teaching is unfinished"
          checked={choices.progressNudgesEnabled}
          disabled={preview}
          onChange={(checked) =>
            setChoices((current) => ({
              ...current,
              progressNudgesEnabled: checked,
            }))
          }
        />
        <ReminderCheckbox
          name={REMINDER_FORM_FIELDS.newContent}
          label="New podcast episodes and videos"
          helper="At most one a day."
          checked={choices.newContentEnabled}
          disabled={preview}
          onChange={(checked) =>
            setChoices((current) => ({ ...current, newContentEnabled: checked }))
          }
        />
        <ReminderCheckbox
          name={REMINDER_FORM_FIELDS.weeklySummary}
          label="Monday summary of your week"
          checked={choices.weeklySummaryEnabled}
          disabled={preview}
          onChange={(checked) =>
            setChoices((current) => ({
              ...current,
              weeklySummaryEnabled: checked,
            }))
          }
        />
      </fieldset>

      {hasPushOnAnyDevice ? null : (
        <p className={SETUP_NOTE}>
          Reminders arrive on devices where notifications are on (step 2).
        </p>
      )}

      {state.error ? (
        <p role="alert" className={SETUP_ERROR}>
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={preview || isPending}
          className={SETUP_PRIMARY_BUTTON}
        >
          {isPending ? "Saving…" : "Save reminders"}
        </button>
        {state.savedAt && !isPending ? (
          <p role="status" className={SETUP_SUCCESS}>
            Saved.
          </p>
        ) : null}
      </div>

      {preview ? (
        <p className={SETUP_NOTE}>Preview mode · Choices are not saved.</p>
      ) : null}
    </form>
  );
}
