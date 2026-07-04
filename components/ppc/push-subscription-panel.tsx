"use client";

import { BellRing, CheckCircle2, LoaderCircle, MonitorSmartphone } from "lucide-react";

import { getPushSubscriptionCopy } from "@/lib/ppc-notifications";
import { usePushSubscription } from "@/lib/push/use-push";

type PushSubscriptionPanelProps = {
  isPushConfigured: boolean;
  audience?: "staff" | "student";
};

export function PushSubscriptionPanel({
  isPushConfigured,
  audience = "staff",
}: PushSubscriptionPanelProps) {
  const { isSupported, isSubscribed, isPending, subscribe } =
    usePushSubscription();
  const isBlocked = !isPushConfigured || !isSupported;
  const copy = getPushSubscriptionCopy(audience);

  return (
    <article className="rounded-sm border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <MonitorSmartphone className="size-4 text-zinc-500" />
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
          This browser
        </h3>
      </div>

      <div className="mt-3 rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
        <p className="text-xs font-medium text-zinc-900">
          {!isPushConfigured
            ? "Push is not configured"
            : !isSupported
              ? "Push is not supported here"
              : isSubscribed
                ? "Subscribed to browser alerts"
                : "Browser alerts are available"}
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          {!isPushConfigured
            ? copy.unavailable
            : !isSupported
              ? "Use a browser with service worker and Push API support."
              : isSubscribed
                ? copy.subscribed
                : copy.available}
        </p>
      </div>

      <button
        type="button"
        onClick={subscribe}
        disabled={isBlocked || isSubscribed || isPending}
        className="mt-3 flex h-8 items-center gap-1.5 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white hover:bg-[var(--color-brand-blue-hover)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <LoaderCircle className="size-3 animate-spin" />
        ) : isSubscribed ? (
          <CheckCircle2 className="size-3" />
        ) : (
          <BellRing className="size-3" />
        )}
        {isPending
          ? "Subscribing"
          : isSubscribed
            ? "Subscribed"
            : "Enable push alerts"}
      </button>
    </article>
  );
}
