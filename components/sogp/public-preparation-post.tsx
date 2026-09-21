import Link from "next/link";
import type { ReactNode } from "react";

import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";

type PublicPreparationPostProps = {
  dayNumber: number;
  title: string | null;
  countdownLabel: string;
  introduction: string;
  cohortTitle: string;
  enrolHref: string;
  dashboardHref: string | null;
  shareBar?: ReactNode;
};

export function PublicPreparationPost({
  dayNumber,
  title,
  countdownLabel,
  introduction,
  cohortTitle,
  enrolHref,
  dashboardHref,
  shareBar,
}: PublicPreparationPostProps) {
  return (
    <PublicSitePageShell minHeight>
      <main className="site-font-theme bg-[var(--color-surface)]">
        <div className="mx-auto w-full max-w-[42rem] px-[var(--site-shell-padding-x)] py-10 md:px-[var(--site-shell-padding-x-md)] md:py-14">
          <Link
            href="/sogp"
            className="site-hero-eyebrow text-[var(--color-brand-blue)]"
          >
            School of God&apos;s Purpose
          </Link>

          <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Pre-SOGP · Day {dayNumber} · {countdownLabel}
          </p>
          <h1 className="site-section-heading mt-2 text-[1.75rem] leading-[1.2] text-[var(--color-text)] md:text-[2rem]">
            {title ?? `Preparation day ${dayNumber}`}
          </h1>

          <p className="site-section-intro mt-4 whitespace-pre-line text-[var(--color-text-muted)]">
            {introduction}
          </p>

          <div className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-5">
            <p className="text-[0.95rem] font-medium text-[var(--color-text)]">
              This is one day of the free Pre-SOGP journey.
            </p>
            <p className="site-section-intro mt-1 text-[var(--color-text-muted)]">
              SOGP is a free four-week path to find truth, discover God&apos;s
              purpose and grow to fulfil it. Enrol to unlock every daily lesson,
              the {cohortTitle} cohort calendar and the live prayer watch.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={enrolHref}
                prefetch
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-6 text-[0.875rem] font-semibold text-white transition-transform duration-150 hover:-translate-y-px"
              >
                Enrol for free
              </Link>
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-4 text-[0.875rem] font-semibold text-[var(--color-brand-blue)] underline underline-offset-4"
                >
                  Open this in your dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-4 text-[0.875rem] font-semibold text-[var(--color-brand-blue)] underline underline-offset-4"
                >
                  Already enrolled? Log in
                </Link>
              )}
            </div>
          </div>

          {shareBar ? <div className="mt-8">{shareBar}</div> : null}
        </div>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
