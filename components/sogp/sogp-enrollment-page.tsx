import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleCheck, Radio } from "lucide-react";

import { AuthGeometryPanel } from "@/components/auth/auth-geometry-panel";
import authCardStyles from "@/components/auth/auth-page-card.module.css";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import { SogpEnrollmentForm } from "./sogp-enrollment-form";
import { SogpPublicQueryProvider } from "./sogp-public-query-provider";
import type { CountryCode } from "libphonenumber-js/min";

const summary = [
  {
    label: "Four weeks",
    meta: "24 guided tracks, Monday to Saturday",
    Icon: CalendarDays,
  },
  {
    label: "Weekly reviews",
    meta: "One live review on weekends",
    Icon: Radio,
  },
  {
    label: "Free enrolment",
    meta: "No payment required to join",
    Icon: CircleCheck,
  },
];

export function SogpEnrollmentPage({
  defaultCountryCode,
}: {
  defaultCountryCode: CountryCode;
}) {
  return (
    <PublicSitePageShell>
      <main className={`${authCardStyles.pageSurface} site-font-theme bg-[var(--color-brand-sky-soft)] px-4 py-8 sm:px-6 md:py-14`}>
        <section className="mx-auto grid w-full max-w-[72rem] overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[var(--shadow-lg)] lg:grid-cols-[minmax(19rem,0.78fr)_minmax(34rem,1.22fr)]">
          <AuthGeometryPanel className="min-h-[14rem] sm:min-h-[18rem] lg:min-h-full" />
          <div className={`${authCardStyles.formPane} relative -mt-8 rounded-t-[2rem] bg-white px-5 py-7 sm:px-8 sm:py-9 lg:mt-0 lg:rounded-none lg:px-12 lg:py-12`}>
            <div className="mx-auto w-full max-w-[38rem]">
              <div className="flex items-center justify-between gap-4">
                <Link
                  href="/sogp"
                  className="inline-flex w-fit items-center gap-1 font-[var(--font-be-vietnam-pro)] text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-blue)] focus-visible:text-[var(--color-brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-blue)]"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  Back
                </Link>
                <Link
                  href="/login?returnTo=/dashboard/sogp"
                  className="font-[var(--font-be-vietnam-pro)] text-xs font-medium text-[var(--color-brand-blue)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-blue)]"
                >
                  Already enrolled? Log in
                </Link>
              </div>
              <div className="mt-6 grid gap-4">
                <h1 className="site-hero-heading max-w-none text-[clamp(2.1rem,8vw,2.35rem)] text-[var(--color-brand-blue)] md:max-w-[15ch] md:text-[clamp(2.35rem,4vw,3rem)]">Take your next step with SOGP</h1>
                <p className="site-section-intro max-w-[34rem] [font-size:0.875rem] leading-[1.55] text-[var(--color-text-muted)]">Join a guided four-week journey into truth, spiritual growth, and God&apos;s purpose.</p>
              </div>
              <div className="mt-6">
                <ul className="grid gap-3">
                  {summary.map(({ label, meta, Icon }) => (
                    <li key={label} className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="grid gap-0.5">
                        <span className="font-[var(--font-be-vietnam-pro)] [font-size:0.875rem] font-medium leading-tight text-[var(--color-text-strong)]">
                          {label}
                        </span>
                        <span className="font-[var(--font-be-vietnam-pro)] [font-size:0.75rem] leading-[1.35] text-[var(--color-text-muted)]">
                          {meta}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 border-t border-[var(--color-line)] pt-7">
                <SogpPublicQueryProvider>
                  <SogpEnrollmentForm defaultCountryCode={defaultCountryCode} />
                </SogpPublicQueryProvider>
              </div>
            </div>
          </div>
        </section>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
