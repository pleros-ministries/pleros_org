"use client";

import { BellIcon, BellOffIcon } from "lucide-react";
import Link from "next/link";

import { usePushSubscription } from "@/lib/push/use-push";

const manageLink = (
  <Link
    href="/dashboard/welcomepack/setup"
    className="w-fit text-xs font-medium text-[var(--color-brand-blue)] underline underline-offset-4"
  >
    Manage reminders
  </Link>
);

export function SogpPushPanel() {
  const { isSupported, isSubscribed, isPending, subscribe } = usePushSubscription();
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <BellIcon className="size-4 text-[var(--color-brand-blue)]" />
        <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
          Prayer Watch reminder
        </h2>
      </div>
      <div className="grid gap-3 p-4">
        {isSubscribed ? (
          // Once reminders are on, the panel stays as the way back to the
          // setup page, where the learner chooses which ones they get.
          <p className="text-xs leading-[1.5] text-zinc-500">Reminders are on.</p>
        ) : (
          <>
            <p className="text-xs leading-[1.5] text-zinc-500">
              A notification shortly before each Prayer Watch session you choose,
              and at your teaching time.
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
          </>
        )}
        {manageLink}
      </div>
    </section>
  );
}
