"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getInstallPromptStatus,
  getServerInstallPromptStatus,
  promptInstall,
  subscribeToInstallPrompt,
} from "@/lib/pwa/install-prompt-store";

export type { InstallPromptStatus } from "@/lib/pwa/install-prompt-store";

// Whether the browser has a share sheet never changes while the page is open,
// so there is nothing to subscribe to.
function subscribeToNothing() {
  return () => {};
}

function getCanShare() {
  return (
    typeof navigator !== "undefined" && typeof navigator.share === "function"
  );
}

function getServerCanShare() {
  return false;
}

export function useInstallPrompt() {
  // The install event is captured by a module-level store, so it is still
  // available here even when it fired before this component mounted.
  const status = useSyncExternalStore(
    subscribeToInstallPrompt,
    getInstallPromptStatus,
    getServerInstallPromptStatus,
  );

  // Read through an external store rather than an effect so we don't setState
  // synchronously in an effect body, and so the server render stays `false`.
  const canShare = useSyncExternalStore(
    subscribeToNothing,
    getCanShare,
    getServerCanShare,
  );

  const shareApp = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      typeof navigator.share !== "function"
    ) {
      return;
    }

    try {
      await navigator.share({
        title: "Pleros",
        text: "Pleros Ministries and Missions — helping you fulfil God's purpose.",
        url: window.location.origin,
      });
    } catch (error) {
      // Dismissing the share sheet rejects with AbortError — that is expected.
      if ((error as DOMException)?.name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }, []);

  return { status, promptInstall, canShare, shareApp };
}
