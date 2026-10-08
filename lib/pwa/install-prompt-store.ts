// A module-level store for the browser's install prompt.
//
// The browser fires `beforeinstallprompt` once, soon after a page loads, and
// never repeats it for a client-side navigation. Listening here, at module
// scope, means the event is kept from whichever page loaded first and is still
// available when a later screen wants to offer "Install app".
//
// This module is imported from the root layout, so it is also evaluated during
// server rendering and in tests without a DOM. Every browser API is therefore
// guarded by a `typeof window` check.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPromptStatus =
  | "pending"
  | "installed"
  | "installable"
  | "ios-manual"
  | "unsupported"
  | "dismissed";

// How long to wait for `beforeinstallprompt` before concluding the browser
// will not offer one. Without this, a screen would briefly show its
// "unsupported" copy on every load before the event arrives.
const SETTLE_MS = 1500;

let deferredEvent: BeforeInstallPromptEvent | null = null;
let installedEventFired = false;
let promptDeclined = false;
let settling = true;

const listeners = new Set<() => void>();

function notify() {
  for (const listener of [...listeners]) {
    listener();
  }
}

function detectInstalled() {
  if (typeof window === "undefined") return false;
  const standaloneMedia = window.matchMedia?.(
    "(display-mode: standalone)",
  ).matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return Boolean(standaloneMedia || iosStandalone);
}

function detectIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS reports itself as a Mac, so tell it apart by its touch screen.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Only take over the prompt inside the dashboard, where we show our own
    // install button. Public pages keep the browser's own install promotion.
    if (window.location.pathname.startsWith("/dashboard")) {
      event.preventDefault();
    }
    deferredEvent = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredEvent = null;
    installedEventFired = true;
    notify();
  });

  window.setTimeout(() => {
    settling = false;
    notify();
  }, SETTLE_MS);
}

export function subscribeToInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallPromptStatus(): InstallPromptStatus {
  if (typeof window === "undefined") return "pending";
  if (installedEventFired || detectInstalled()) return "installed";
  if (deferredEvent) return "installable";
  // A declined prompt cannot be shown again with the same event.
  if (promptDeclined) return "dismissed";
  if (detectIos()) return "ios-manual";
  return settling ? "pending" : "unsupported";
}

export function getServerInstallPromptStatus(): InstallPromptStatus {
  return "pending";
}

export async function promptInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  const event = deferredEvent;
  if (!event) return "unavailable";

  let outcome: "accepted" | "dismissed";
  try {
    await event.prompt();
    outcome = (await event.userChoice).outcome;
  } catch {
    // The browser refuses to show a prompt twice or without a user gesture.
    outcome = "dismissed";
  }

  // The event is single-use whatever the learner chose.
  if (deferredEvent === event) {
    deferredEvent = null;
  }
  if (outcome === "dismissed") {
    promptDeclined = true;
  }
  notify();
  return outcome;
}
