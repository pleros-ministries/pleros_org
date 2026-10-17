"use client";

import { BellIcon } from "lucide-react";

import { usePushSubscription } from "@/lib/push/use-push";

export type ReminderPromptState = "subscribe" | "blocked" | "unsupported" | "ready";

/** Pure state matrix, unit-tested; the component only renders it. */
export function reminderPromptState(input: {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: string;
}): ReminderPromptState {
  if (input.isSubscribed) return "ready";
  if (!input.isSupported) return "unsupported";
  if (input.permission === "denied") return "blocked";
  return "subscribe";
}

const cardClass =
  "grid gap-2 rounded-xl border border-(--color-line) bg-white p-4";
const titleClass = "text-[15px] font-medium text-(--color-text-strong)";
const noteClass = "text-[13px] leading-[1.5] text-(--color-text-muted)";
const buttonClass =
  "inline-flex min-h-[38px] w-full items-center justify-between gap-3 rounded-[11px] bg-(--color-brand-sky) px-4 text-sm font-medium text-(--color-brand-blue) disabled:opacity-60";

/**
 * In-app push-subscribe prompt. Button-initiated only, never auto-fired, so
 * the browser's user-gesture requirement is always met. Renders nothing once
 * this device is subscribed.
 */
export function PrayerReminderPrompt({
  variant = "card",
}: {
  variant?: "card" | "row";
}) {
  const push = usePushSubscription();
  const state = reminderPromptState(push);
  if (state === "ready") return null;

  if (state === "blocked") {
    return (
      <div className={variant === "card" ? cardClass : "grid gap-1 py-1"}>
        <p className={variant === "card" ? titleClass : "text-[13px] font-medium text-(--color-text-strong)"}>
          Reminders are blocked on this device
        </p>
        <p className={noteClass}>
          Allow notifications for this site in your browser settings, then come
          back to turn them on.
        </p>
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className={variant === "card" ? cardClass : "grid gap-1 py-1"}>
        <p className={variant === "card" ? titleClass : "text-[13px] font-medium text-(--color-text-strong)"}>
          Open from your Home Screen
        </p>
        <p className={noteClass}>
          Reminders need the installed app on this iPhone. Add Pleros to your
          Home Screen, open it from there, then turn reminders on.
        </p>
      </div>
    );
  }

  return (
    <div className={variant === "card" ? cardClass : "grid gap-2 py-1"}>
      {variant === "card" ? (
        <>
          <p className={titleClass}>Get reminded before each session</p>
          <p className={noteClass}>
            A reminder 10 minutes before the morning, afternoon and evening
            sessions, on this device.
          </p>
        </>
      ) : (
        <p className="text-[13px] font-medium text-(--color-text-strong)">
          Reminders on this device
        </p>
      )}
      <button
        type="button"
        className={buttonClass}
        disabled={push.isPending}
        onClick={() => void push.subscribe()}
      >
        {push.isPending ? "Turning on…" : "Turn on reminders"}
        <BellIcon className="size-4" aria-hidden="true" />
      </button>
      {push.error === "failed" ? (
        <p role="alert" className={noteClass}>
          We could not turn on reminders. Please try again.
        </p>
      ) : null}
    </div>
  );
}
