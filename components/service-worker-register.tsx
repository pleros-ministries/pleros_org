"use client";

import { useEffect } from "react";

// Must load on every page so the browser's one-off install event is not missed.
import "@/lib/pwa/install-prompt-store";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures are non-fatal (e.g. unsupported browser context).
    });
  }, []);

  return null;
}
