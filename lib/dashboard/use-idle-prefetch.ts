"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Fully prefetches a set of destinations once the browser is idle (user request,
 * 18 October: tab switches should feel native). `router.prefetch` loads the whole
 * page, which the client router keeps for `staleTimes.static` (3 minutes), so the
 * tap that follows renders at once instead of showing a loading screen.
 */
export function useIdlePrefetch(hrefs: Array<string | null | undefined>) {
  const router = useRouter();
  const key = hrefs.filter(Boolean).join("|");
  useEffect(() => {
    if (!key) return;
    const targets = key.split("|");
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 400));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => targets.forEach(href => router.prefetch(href)));
    return () => cancel(handle);
  }, [key, router]);
}
