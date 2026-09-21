"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, LinkIcon, UsersIcon } from "lucide-react";
import Link from "next/link";

import { ProgressBar } from "@/components/ppc/progress-bar";
import type { ReferralsDashboardData } from "@/lib/db/queries/sogp-referrals";
import {
  buildReferralShareMessage,
  referralStageLabel,
} from "@/lib/sogp/referral";
import {
  buildPreSogpShareIntentUrl,
  type PreSogpShareIntentPlatform,
} from "@/lib/sogp/share";

import { ShareIntentButtons } from "./share-intent-buttons";
import { SogpActivitySection } from "./sogp-activity-section";

const queryKey = ["sogp", "referrals"] as const;
const PLATFORMS: PreSogpShareIntentPlatform[] = [
  "whatsapp",
  "facebook",
  "x",
  "telegram",
];

async function fetchReferrals() {
  const response = await fetch("/api/sogp/referrals", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("Your referrals could not load.");
  return response.json() as Promise<ReferralsDashboardData>;
}

function formatJoined(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export function ReferralsPage({
  initialData,
  preview = false,
}: {
  initialData?: ReferralsDashboardData;
  preview?: boolean;
} = {}) {
  const activeQueryKey = [...queryKey, preview ? "preview" : "live"] as const;
  const { data } = useSuspenseQuery({
    queryKey: activeQueryKey,
    queryFn: preview ? async () => initialData! : fetchReferrals,
    initialData,
  });

  const message = buildReferralShareMessage();
  const hrefs = Object.fromEntries(
    PLATFORMS.map((platform) => [
      platform,
      buildPreSogpShareIntentUrl({
        platform,
        postUrl: data.referralUrl,
        message,
      }),
    ]),
  ) as Record<PreSogpShareIntentPlatform, string>;

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav
        aria-label="SOGP dashboard navigation"
        className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm"
      >
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href={preview ? "/preview/dashboard" : "/dashboard/sogp"}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            SOGP
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            Invite friends
          </h1>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {data.referredCount} joined so far
          </p>
        </header>

        <SogpActivitySection
          title="Your referral link"
          description="Share this link. Anyone who enrols through it is added below."
          icon={
            <LinkIcon
              className="size-4 text-[var(--color-brand-blue)]"
              strokeWidth={2}
            />
          }
        >
          <p className="break-all rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
            {data.referralUrl}
          </p>
          <ShareIntentButtons
            hrefs={hrefs}
            copyValue={data.referralUrl}
            nativeShare={{
              title: "Join me on SOGP",
              text: message,
              url: data.referralUrl,
            }}
          />
        </SogpActivitySection>

        <SogpActivitySection
          title={`People you referred (${data.referredCount})`}
          icon={
            <UsersIcon
              className="size-4 text-[var(--color-brand-blue)]"
              strokeWidth={2}
            />
          }
        >
          {data.referred.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No one yet — share your link above to invite people.
            </p>
          ) : (
            <ul className="grid gap-3">
              {data.referred.map((person, index) => (
                <li
                  key={`${person.firstName}-${index}`}
                  className="grid gap-1.5 rounded-sm border border-zinc-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-zinc-900">
                      {person.firstName}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-600">
                      {referralStageLabel(person.stage)}
                    </span>
                  </div>
                  <p className="text-[0.7rem] text-zinc-400">
                    Joined {formatJoined(person.joinedAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={person.preparationDaysComplete}
                      max={data.preparationDaysTotal}
                    />
                    <span className="shrink-0 text-[0.7rem] text-zinc-500">
                      {person.preparationDaysComplete} of{" "}
                      {data.preparationDaysTotal}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SogpActivitySection>
      </div>
    </section>
  );
}
