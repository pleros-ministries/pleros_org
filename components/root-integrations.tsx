"use client";

import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@/components/google-analytics";
import { MetaPixel } from "@/components/meta-pixel";
import { PushNotificationPrompt } from "@/components/push-notification-prompt";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

/** Synthetic demo routes never mount tracking, push or service-worker effects. */
export function RootIntegrations() {
  const pathname = usePathname();
  if (pathname === "/preview/pleros" || pathname.startsWith("/preview/pleros/")) {
    return null;
  }
  return (
    <>
      <ServiceWorkerRegister />
      <PushNotificationPrompt />
      <GoogleAnalytics />
      <MetaPixel />
    </>
  );
}
