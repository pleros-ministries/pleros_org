"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, AwardIcon, DownloadIcon, Share2Icon } from "lucide-react";

import type { SogpJourneyWeekCertificate } from "@/lib/db/queries/sogp-journey";
import type { SogpAssessmentPolicy } from "@/lib/sogp/types";

import { describeWeekCertificateStatus } from "./sogp-certificates-card";
import { trackSogpEvent } from "./sogp-analytics";
import {
  ShareWeekCertificateDialog,
  type ShareableWeekCertificate,
} from "./share-week-certificate-dialog";

export type SogpCertificatesPageData = {
  cohortTitle: string;
  todayKey: string;
  policy: SogpAssessmentPolicy;
  weeks: SogpJourneyWeekCertificate[];
  final: { verificationCode: string; issuedAt: string } | null;
  earlier: {
    weeks: Array<{
      cohortTitle: string;
      week: number;
      title: string;
      verificationCode: string;
      issuedAt: string;
    }>;
    finals: Array<{ cohortTitle: string; verificationCode: string; issuedAt: string }>;
  };
  shareUrl: string;
};

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

function formatLongDate(iso: string) {
  return longDate.format(new Date(iso));
}

function describeRule(policy: SogpAssessmentPolicy) {
  const teachings =
    policy.requiredTrackCompletionPercent >= 100
      ? "complete all six teachings"
      : `complete at least ${policy.requiredTrackCompletionPercent}% of the week's teachings`;
  const attendance =
    policy.requiredPrayerWatchPercent === policy.requiredLiveClassPercent
      ? `attend at least ${policy.requiredPrayerWatchPercent}% of that week's morning Prayer Watch and reviews`
      : `attend at least ${policy.requiredPrayerWatchPercent}% of that week's morning Prayer Watch and ${policy.requiredLiveClassPercent}% of its reviews`;
  return `To earn a week's certificate, ${teachings} and ${attendance}.`;
}

const primaryButton =
  "inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white transition-transform duration-150 active:scale-[0.98]";
const secondaryButton =
  "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 active:scale-[0.98]";

function weekDownloadHref(code: string) {
  return `/api/sogp/week-certificates/${encodeURIComponent(code)}`;
}

function ProgressLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-zinc-500">{label}</span>
      <strong className="ppc-heading text-right font-semibold text-zinc-900">{value}</strong>
    </div>
  );
}

function WeekCard({
  week,
  todayKey,
  onShare,
}: {
  week: SogpJourneyWeekCertificate;
  todayKey: string;
  onShare: (certificate: ShareableWeekCertificate) => void;
}) {
  const earned = week.certificate;
  return (
    <article
      className={`grid content-start gap-3 rounded-[var(--radius-md)] border bg-white p-4 shadow-sm ${earned ? "border-[var(--color-brand-lime)]" : "border-zinc-200"}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${earned ? "bg-[var(--color-brand-lime)]" : "bg-zinc-100"}`}
        >
          {earned ? (
            <AwardIcon className="size-5 text-[var(--color-brand-blue)]" strokeWidth={2.2} />
          ) : (
            <span className="text-sm font-semibold text-zinc-500">{week.week}</span>
          )}
        </span>
        <div className="grid min-w-0 gap-0.5">
          <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
            Week {week.week} certificate
          </h2>
          <p className="text-xs leading-[1.45] text-zinc-500">{week.title}</p>
        </div>
      </div>

      {earned ? (
        <>
          <p className="text-xs text-zinc-500">Earned {formatLongDate(earned.issuedAt)}</p>
          <div className="flex flex-wrap gap-2">
            <a
              href={weekDownloadHref(earned.verificationCode)}
              onClick={() => trackSogpEvent("sogp_week_certificate_downloaded", { week: week.week })}
              className={primaryButton}
            >
              <DownloadIcon className="size-3.5" /> Download PDF
            </a>
            <button
              type="button"
              onClick={() =>
                onShare({
                  week: week.week,
                  title: week.title,
                  verificationCode: earned.verificationCode,
                })
              }
              className={secondaryButton}
            >
              <Share2Icon className="size-3.5" /> Share image
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-medium text-zinc-700">
            {describeWeekCertificateStatus(week, todayKey)}
          </p>
          {week.revoked ? null : (
            <div className="grid gap-1.5 border-t border-zinc-100 pt-3">
              <ProgressLine
                label="Teachings"
                value={`${week.teachings.completed} of ${week.teachings.total}`}
              />
              <ProgressLine
                label="Prayer Watch"
                value={`${week.prayerWatch.completed} of ${week.prayerWatch.total} days (${week.prayerWatch.needed} needed)`}
              />
              <ProgressLine
                label="Reviews"
                value={
                  week.reviews.total
                    ? `${week.reviews.completed} of ${week.reviews.total} (${week.reviews.needed} needed)`
                    : "None this week"
                }
              />
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function SogpCertificatesPage({ data }: { data: SogpCertificatesPageData }) {
  const [sharing, setSharing] = useState<ShareableWeekCertificate | null>(null);
  const hasEarlier = data.earlier.weeks.length > 0 || data.earlier.finals.length > 0;

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface-muted)] pb-16 text-zinc-900">
      <nav
        aria-label="SOGP dashboard navigation"
        className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm"
      >
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard/sogp"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> SOGP
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            Certificates
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-5 pb-6 pt-5">
        <header className="grid gap-1.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
            {data.cohortTitle}
          </p>
          <h1 className="ppc-heading text-2xl font-semibold tracking-[-0.02em] text-zinc-900">
            Your certificates
          </h1>
          <p className="max-w-2xl text-sm leading-[1.55] text-zinc-600">
            Earn a certificate for each week you complete, then your final SOGP certificate at the end of the course.
          </p>
          <p className="max-w-2xl text-xs leading-[1.55] text-zinc-500">{describeRule(data.policy)}</p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {data.weeks.map((week) => (
            <WeekCard
              key={week.week}
              week={week}
              todayKey={data.todayKey}
              onShare={setSharing}
            />
          ))}
        </div>

        <section className="grid gap-3 rounded-[var(--radius-md)] border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full ${data.final ? "bg-[var(--color-brand-lime)]" : "bg-zinc-100"}`}
            >
              <AwardIcon
                className={`size-5 ${data.final ? "text-[var(--color-brand-blue)]" : "text-zinc-400"}`}
                strokeWidth={2.2}
              />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Final certificate</h2>
              <p className="text-xs leading-[1.45] text-zinc-500">
                {data.final
                  ? `Issued ${formatLongDate(data.final.issuedAt)}`
                  : "Your final certificate is issued by the SOGP team when you meet the course requirements."}
              </p>
            </div>
          </div>
          {data.final ? (
            <a
              href={`/api/sogp/certificate/${encodeURIComponent(data.final.verificationCode)}`}
              className={`${primaryButton} w-fit`}
            >
              <DownloadIcon className="size-3.5" /> Download certificate
            </a>
          ) : null}
        </section>

        {hasEarlier ? (
          <section className="grid gap-2">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">From earlier cohorts</h2>
            <ul className="grid divide-y divide-zinc-100 rounded-[var(--radius-md)] border border-zinc-200 bg-white shadow-sm">
              {data.earlier.weeks.map((item) => (
                <li key={item.verificationCode} className="flex items-center gap-3 p-3">
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="ppc-heading text-xs font-semibold text-zinc-900">
                      Week {item.week} certificate · {item.title}
                    </span>
                    <span className="text-[0.7rem] text-zinc-500">
                      {item.cohortTitle} · {formatLongDate(item.issuedAt)}
                    </span>
                  </span>
                  <a
                    href={weekDownloadHref(item.verificationCode)}
                    className="shrink-0 text-xs font-semibold text-[var(--color-brand-blue)]"
                  >
                    Download
                  </a>
                </li>
              ))}
              {data.earlier.finals.map((item) => (
                <li key={item.verificationCode} className="flex items-center gap-3 p-3">
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="ppc-heading text-xs font-semibold text-zinc-900">
                      Final certificate
                    </span>
                    <span className="text-[0.7rem] text-zinc-500">
                      {item.cohortTitle} · {formatLongDate(item.issuedAt)}
                    </span>
                  </span>
                  <a
                    href={`/api/sogp/certificate/${encodeURIComponent(item.verificationCode)}`}
                    className="shrink-0 text-xs font-semibold text-[var(--color-brand-blue)]"
                  >
                    Download
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {sharing ? (
        <ShareWeekCertificateDialog
          certificate={sharing}
          shareUrl={data.shareUrl}
          open
          onOpenChange={(next) => {
            if (!next) setSharing(null);
          }}
        />
      ) : null}
    </section>
  );
}
