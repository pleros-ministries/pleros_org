"use client";

import { BellIcon } from "lucide-react";

import type { usePushSubscription } from "@/lib/push/use-push";
import type { InstallPromptStatus } from "@/lib/pwa/use-install-prompt";

import { SETUP_ERROR, SETUP_NOTE, SETUP_PRIMARY_BUTTON } from "./styles";

/** Step 2: turn on push notifications for this device. */
export function NotificationsStep({
  push,
  installStatus,
  hasPushOnAnyDevice,
  hydrated,
  preview,
}: {
  push: ReturnType<typeof usePushSubscription>;
  installStatus: InstallPromptStatus;
  /** The learner already has notifications on somewhere. */
  hasPushOnAnyDevice: boolean;
  hydrated: boolean;
  preview: boolean;
}) {
  if (preview) {
    return (
      <>
        <button type="button" disabled className={SETUP_PRIMARY_BUTTON}>
          <BellIcon className="size-4" aria-hidden="true" />
          Turn on notifications
        </button>
        <p className={SETUP_NOTE}>
          Preview mode · Notifications are unavailable in this preview.
        </p>
      </>
    );
  }

  // The browser's answers are only known once this is running in the browser;
  // until then, saying "not supported" would be a guess.
  if (!hydrated) {
    return <p className={SETUP_NOTE}>Checking this device…</p>;
  }

  if (push.isSubscribed) {
    return <p>Notifications are on for this device.</p>;
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return <p className={SETUP_NOTE}>Notifications are being set up.</p>;
  }

  const supported = "serviceWorker" in navigator && "PushManager" in window;

  if (!supported) {
    // An iPhone or iPad only allows notifications from the installed app.
    return installStatus === "ios-manual" ? (
      <p>
        On iPhone, notifications work once you have installed the app in step
        1.
      </p>
    ) : (
      <p>
        This browser cannot show notifications. Open pleros.org in Chrome or
        Safari.
      </p>
    );
  }

  if (push.permission === "denied" || push.error === "denied") {
    return (
      <p>
        Notifications are blocked for Pleros. Allow them in your browser
        settings, then try again.
      </p>
    );
  }

  return (
    <>
      {hasPushOnAnyDevice ? (
        <p className={SETUP_NOTE}>On for another device. Turn them on here too.</p>
      ) : null}
      <button
        type="button"
        onClick={push.subscribe}
        disabled={push.isPending}
        className={SETUP_PRIMARY_BUTTON}
      >
        <BellIcon className="size-4" aria-hidden="true" />
        {push.isPending ? "Turning on…" : "Turn on notifications"}
      </button>
      {push.error === "failed" ? (
        <p role="alert" className={SETUP_ERROR}>
          We could not turn on notifications. Please try again.
        </p>
      ) : null}
    </>
  );
}
