"use client";

import { useCallback, useEffect, useState } from "react";

type PushPermission = NotificationPermission | "unsupported";
type PushError = "denied" | "failed" | null;

// `Notification` does not exist in an iOS Safari tab; it only appears once the
// site is opened from the Home Screen.
function readPermission(): PushPermission {
  return typeof Notification === "undefined"
    ? "unsupported"
    : Notification.permission;
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const [error, setError] = useState<PushError>(null);

  useEffect(() => {
    // Deferred so state is not set synchronously in the effect body.
    const timer = window.setTimeout(() => {
      setIsSupported(
        typeof navigator !== "undefined" &&
          "serviceWorker" in navigator &&
          "PushManager" in window,
      );
      setPermission(readPermission());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const checkSubscription = useCallback(async () => {
    if (!isSupported) {
      setIsSubscribed(false);
      return;
    }

    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const sub = await reg?.pushManager?.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }, [isSupported]);

  useEffect(() => {
    void checkSubscription();
  }, [checkSubscription]);

  const subscribe = useCallback(async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !isSupported) return;

    setError(null);
    setIsPending(true);
    try {
      let sub: PushSubscription;
      // Whether this attempt made the subscription, or the browser already
      // had one (for example from the public banner).
      let createdHere = false;
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const existing = await reg.pushManager.getSubscription();
        createdHere = !existing;
        sub =
          existing ??
          // This call shows the browser's permission prompt when it is needed.
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          }));
      } catch (err) {
        console.error("Push subscription failed:", err);
        setError(readPermission() === "denied" ? "denied" : "failed");
        return;
      }

      let bound = false;
      try {
        const json = sub.toJSON();
        const response = await fetch("/api/sogp/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
          }),
        });
        bound = response.ok;
      } catch (err) {
        console.error("Push subscription failed:", err);
      }

      if (!bound) {
        // The server did not link this device to the learner, so nothing new
        // would be delivered. Undo a subscription this attempt created, so the
        // browser and the server stay in step and the learner can try again.
        // One that existed before is left alone: it may still be serving this
        // device.
        if (createdHere) {
          await sub.unsubscribe().catch(() => undefined);
        }
        setIsSubscribed(!createdHere);
        setError("failed");
        return;
      }

      setIsSubscribed(true);
    } finally {
      setPermission(readPermission());
      setIsPending(false);
    }
  }, [isSupported]);

  return { isSupported, isSubscribed, isPending, permission, error, subscribe };
}
