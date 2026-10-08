"use client";

import { useSyncExternalStore } from "react";

// Neither value changes while the page is open, so there is nothing to
// subscribe to. Reading them through an external store keeps the server render
// and the first client render identical, then fills in the browser's answer.
function subscribeToNothing() {
  return () => {};
}

function readTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** False on the server and during hydration, true in the browser after it. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

/** The learner's IANA time zone, or null until the browser has reported it. */
export function useBrowserTimeZone(): string | null {
  return useSyncExternalStore(subscribeToNothing, readTimeZone, () => null);
}
