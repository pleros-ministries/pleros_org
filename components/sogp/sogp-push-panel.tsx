"use client";

import { BellIcon, BellOffIcon, CheckCircleIcon } from "lucide-react";

import { usePushSubscription } from "@/lib/push/use-push";

export function SogpPushPanel() {
  const { isSupported, isSubscribed, isPending, subscribe } = usePushSubscription();
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  return (
    <section className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
      <div className="flex items-center gap-2">
        <BellIcon className="size-5 text-[var(--color-brand-blue)]" />
        <h2 className="font-[var(--font-sen)] text-lg font-semibold text-[var(--color-text-strong)]">
          Prayer Watch reminder
        </h2>
      </div>
      <p className="text-xs leading-[1.5] text-[var(--color-text-muted)]">
        Receive one browser notification at 5:20 am, ten minutes before Morning Prayer Watch.
      </p>
      {!isConfigured || !isSupported ? (
        <p className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
          <BellOffIcon className="size-4" />
          {!isConfigured ? "Browser reminders are being configured." : "This browser does not support push reminders."}
        </p>
      ) : isSubscribed ? (
        <p className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <CheckCircleIcon className="size-4" /> Prayer Watch reminders enabled
        </p>
      ) : (
        <button
          type="button"
          onClick={subscribe}
          disabled={isPending}
          className="min-h-10 w-fit rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white disabled:opacity-55"
        >
          {isPending ? "Enabling…" : "Enable Prayer Watch reminders"}
        </button>
      )}
    </section>
  );
}
