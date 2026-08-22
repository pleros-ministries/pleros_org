"use client";

import { useEffect } from "react";

import {
  sanitizeSogpAnalyticsPayload,
  type SogpAnalyticsEvent,
} from "@/lib/sogp/analytics";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackSogpEvent(
  event: SogpAnalyticsEvent,
  payload: Record<string, string | number | boolean | null | undefined> = {},
) {
  const safe = sanitizeSogpAnalyticsPayload(payload);
  window.dataLayer?.push({ event, ...safe });
  window.fbq?.("trackCustom", event, safe);
}

export function SogpLandingAnalytics() {
  useEffect(() => {
    trackSogpEvent("sogp_landing_view");
  }, []);
  return null;
}
