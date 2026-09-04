"use client";

import { useEffect, useState } from "react";

import {
  PRE_SOGP_SHARE_PLATFORMS,
  buildPreSogpPostUrl,
  buildPreSogpShareIntentUrl,
  buildPreSogpShareMessage,
  type PreSogpShareIntentPlatform,
} from "@/lib/sogp/share";

import { ShareIntentButtons } from "./share-intent-buttons";

const INTENT_PLATFORMS = PRE_SOGP_SHARE_PLATFORMS.filter(
  (platform): platform is PreSogpShareIntentPlatform =>
    platform !== "copy" && platform !== "native",
);

function configuredOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ||
    ""
  ).replace(/\/$/, "");
}

export function SharePreparationDay({
  dateKey,
  dayLabel,
  title,
}: {
  dateKey: string;
  dayLabel: string;
  title: string;
}) {
  const [origin, setOrigin] = useState(
    () => configuredOrigin() || "https://pleros.org",
  );

  useEffect(() => {
    if (!configuredOrigin() && typeof window !== "undefined") {
      const timer = window.setTimeout(() => setOrigin(window.location.origin), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const message = buildPreSogpShareMessage({ dayLabel, title });

  const hrefs = Object.fromEntries(
    INTENT_PLATFORMS.map((platform) => [
      platform,
      buildPreSogpShareIntentUrl({
        platform,
        postUrl: buildPreSogpPostUrl({ siteUrl: origin, dateKey, platform }),
        message,
      }),
    ]),
  ) as Record<PreSogpShareIntentPlatform, string>;

  return (
    <ShareIntentButtons
      hrefs={hrefs}
      copyValue={buildPreSogpPostUrl({ siteUrl: origin, dateKey, platform: "copy" })}
      nativeShare={{
        title: `SOGP · ${dayLabel}`,
        text: message,
        url: buildPreSogpPostUrl({ siteUrl: origin, dateKey, platform: "native" }),
      }}
    />
  );
}
