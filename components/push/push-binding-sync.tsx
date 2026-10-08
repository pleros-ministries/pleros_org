"use client";

import { useEffect } from "react";

const BOUND_STORAGE_KEY = "pleros:push-bound";

// Links the push subscription this browser already holds to the signed-in
// learner. It repairs devices that subscribed through the public, anonymous
// banner (the browser looks subscribed, but no learner-bound record exists, so
// personal reminders reach nobody) and re-binds a shared device to whoever is
// signed in now.
export function PushBindingSync({ userId }: { userId: string }) {
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      if (
        typeof navigator === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        return;
      }

      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager?.getSubscription();
        if (!subscription || cancelled) return;

        const marker = `${userId}:${subscription.endpoint}`;

        // Once per tab session is enough; the marker stops a request on every
        // dashboard navigation.
        try {
          if (window.sessionStorage.getItem(BOUND_STORAGE_KEY) === marker) {
            return;
          }
        } catch {
          // sessionStorage can throw in private mode — carry on and bind.
        }

        const json = subscription.toJSON();
        const response = await fetch("/api/sogp/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
          }),
        });

        // Only remember a successful bind, so a failure is retried next time.
        if (!response.ok || cancelled) return;

        try {
          window.sessionStorage.setItem(BOUND_STORAGE_KEY, marker);
        } catch {
          // Ignore write failures; the bind itself has succeeded.
        }
      } catch {
        // Binding is a background repair, so a failure must never surface.
      }
    };

    void sync();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return null;
}
