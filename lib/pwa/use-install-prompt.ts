"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPromptStatus =
  | "pending"
  | "installed"
  | "installable"
  | "ios-manual"
  | "unsupported";

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
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function useInstallPrompt() {
  const [status, setStatus] = useState<InstallPromptStatus>("pending");
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as BeforeInstallPromptEvent;
      setStatus("installable");
    };

    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // Defer the initial read so we don't setState synchronously in the effect
    // body, and so a `beforeinstallprompt` fired before hydration still wins.
    const timer = window.setTimeout(() => {
      if (detectInstalled()) {
        setStatus("installed");
      } else if (deferredPrompt.current) {
        setStatus("installable");
      } else if (detectIos()) {
        setStatus("ios-manual");
      } else {
        setStatus("unsupported");
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const event = deferredPrompt.current;
    if (!event) return;

    await event.prompt();
    await event.userChoice;
    deferredPrompt.current = null;
  }, []);

  return { status, promptInstall };
}
