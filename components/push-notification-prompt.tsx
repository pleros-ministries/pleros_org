"use client";

import { useEffect, useState } from "react";

import { useSitePushSubscription } from "@/lib/push/use-site-push";

const DISMISSED_KEY = "pleros-push-prompted";

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, isPending, subscribe } = useSitePushSubscription();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const isDismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
    const timer = window.setTimeout(() => setDismissed(isDismissed), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  if (!isSupported || isSubscribed || dismissed) return null;

  return (
    <div className="site-font-theme fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-white/10 bg-[var(--color-brand-blue)] px-4 py-3.5 text-white shadow-[0_-8px_24px_rgba(1,21,133,0.28)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-white/90">
        Get notified about new videos and upcoming prayer watches.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="cursor-pointer rounded-[var(--radius-pill)] px-3.5 py-2 text-sm text-white/80 transition-colors duration-150 hover:text-white"
        >
          No thanks
        </button>
        <button
          type="button"
          onClick={async () => {
            await subscribe();
            dismiss();
          }}
          disabled={isPending}
          className="cursor-pointer rounded-[var(--radius-pill)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-brand-blue)] transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Enabling…" : "Enable"}
        </button>
      </div>
    </div>
  );
}
