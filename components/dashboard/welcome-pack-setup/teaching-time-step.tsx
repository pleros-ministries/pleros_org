"use client";

import { useActionState, useState } from "react";

import {
  INITIAL_REMINDER_ACTION_STATE,
  REMINDER_FORM_FIELDS,
  type ReminderFormAction,
  type ReminderSetupView,
} from "@/lib/notifications/reminder-preferences";
import { formatClock } from "@/lib/notifications/zoned-time";

import {
  SETUP_ERROR,
  SETUP_HELPER,
  SETUP_LABEL,
  SETUP_NOTE,
  SETUP_PRIMARY_BUTTON,
  SETUP_SUCCESS,
} from "./styles";

/** Step 3: one daily teaching time, in the learner's own time zone. */
export function TeachingTimeStep({
  view,
  timeZone,
  enrolled,
  action,
  preview,
}: {
  view: ReminderSetupView;
  /** The browser's zone; null until it is known. */
  timeZone: string | null;
  enrolled: boolean;
  action: ReminderFormAction;
  preview: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_REMINDER_ACTION_STATE,
  );
  // Controlled, so the chosen time stays put when the form resets after a
  // save.
  const [time, setTime] = useState(view.teachingTime);

  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-1.5">
        <label htmlFor="teaching-time" className={SETUP_LABEL}>
          I will study each day at
        </label>
        <div className="sogp-field-control max-w-[11rem]">
          {/* 16px text stops phones zooming the page when the field opens.
              It is an inline style because the field class sets its own size
              outside Tailwind's layers, which a utility class cannot beat. */}
          <input
            id="teaching-time"
            type="time"
            name={REMINDER_FORM_FIELDS.teachingTime}
            step={300}
            required
            disabled={preview}
            value={time}
            onChange={(event) => setTime(event.target.value)}
            aria-describedby="teaching-time-help"
            className="sogp-field-input"
            style={{ fontSize: "1rem" }}
          />
        </div>
      </div>

      {/* Sent with every save, so a learner who has moved is followed. */}
      <input
        type="hidden"
        name={REMINDER_FORM_FIELDS.timeZone}
        value={timeZone ?? view.timeZone}
      />

      <div id="teaching-time-help" className="grid gap-1">
        {timeZone ? (
          <p className={SETUP_HELPER}>Your time zone: {timeZone}</p>
        ) : null}
        <p className={SETUP_HELPER}>
          Each week&rsquo;s teachings open on Monday at 6:00 am WAT.
        </p>
        {enrolled ? null : (
          <p className={SETUP_HELPER}>
            Your teaching reminder starts once you enrol in SOGP.
          </p>
        )}
      </div>

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
          {isPending ? "Saving…" : "Save time"}
        </button>
        {state.savedAt && !isPending ? (
          <p role="status" className={SETUP_SUCCESS}>
            {/* The page reloads its data after a save, so this is the stored
                time rather than whatever is in the field now. */}
            {view.teachingTimeMinutes !== null
              ? `Saved. Your teaching time is ${formatClock(view.teachingTimeMinutes)}.`
              : "Saved."}
          </p>
        ) : null}
      </div>

      {preview ? (
        <p className={SETUP_NOTE}>Preview mode · Choices are not saved.</p>
      ) : null}
    </form>
  );
}
