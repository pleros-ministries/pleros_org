"use client";

import { Suspense, useSyncExternalStore, type ReactNode } from "react";

const subscribeToNothing = () => () => {};

/**
 * Suspense that only runs its children in the browser. The SOGP screens fetch
 * relative `/api/sogp/...` URLs through useSuspenseQuery; on the server those
 * fetches fail, which made React throw away the server render and start again
 * on the client. The server now sends the skeleton and the browser fetches once.
 */
export function BrowserSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false);
  if (!hydrated) return <>{fallback}</>;
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
