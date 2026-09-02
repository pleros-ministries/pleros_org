"use client";

import { BellIcon, BellOffIcon } from "lucide-react";

import { usePushSubscription } from "@/lib/push/use-push";

export function SogpPushPanel() {
  const { isSupported, isSubscribed, isPending, subscribe } = usePushSubscription();
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  // Once the learner has enabled reminders there is nothing left to act on, so
  // the panel removes itself rather than lingering as a confirmation.
  if (isSubscribed) return null;

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <BellIcon className="size-4 text-[var(--color-brand-blue)]" />
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Prayer Watch reminder
        </h2>
      </div>
      <div className="grid gap-3 p-4">
        <p className="text-xs leading-[1.5] text-zinc-500">
          Receive one browser notification at 5:20 am, ten minutes before Morning
          Prayer Watch.
        </p>
        {!isConfigured || !isSupported ? (
          <p className="inline-flex items-center gap-2 text-xs text-zinc-500">
            <BellOffIcon className="size-4" />
            {!isConfigured
              ? "Browser reminders are being configured."
              : "This browser does not support push reminders."}
          </p>
        ) : (
          <button
            type="button"
            onClick={subscribe}
            disabled={isPending}
            className="inline-flex h-8 w-fit cursor-pointer items-center rounded-[6px] bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isPending ? "Enabling…" : "Enable Prayer Watch reminders"}
          </button>
        )}
      </div>
    </section>
  );
}
