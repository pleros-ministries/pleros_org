import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeftIcon, GiftIcon } from "lucide-react";

import { FirstTimeWorshipperForm } from "@/components/home/first-time-worshipper-form";
import { HomepageFooter } from "@/components/home/homepage-footer";
import { HomepageNav } from "@/components/home/homepage-nav";
import { PublicSitePageShell } from "@/components/home/public-site-page-shell";
import {
  readWelcomeAccessToken,
  WELCOME_ACCESS_COOKIE_NAME,
} from "@/lib/welcome-access";

export const metadata: Metadata = {
  title: "First time with us",
  description: "Tell us where you joined Fullness of Christ Church so we can send you a special gift.",
};

type FirstTimeWorshipperPageProps = {
  searchParams: Promise<{ submitted?: string }>;
};

export default async function FirstTimeWorshipperRoute({
  searchParams,
}: FirstTimeWorshipperPageProps) {
  const [{ submitted }, cookieStore] = await Promise.all([searchParams, cookies()]);
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

  return (
    <PublicSitePageShell minHeight>
      <HomepageNav />
      <main className="site-font-theme bg-[var(--color-brand-sky)] px-[1.25rem] py-12 md:px-8 md:py-16 xl:px-10 xl:py-20">
        <div className="mx-auto grid max-w-[62rem] gap-8 md:grid-cols-[minmax(0,0.88fr)_minmax(22rem,0.72fr)] md:items-center md:gap-12">
          <section className="grid gap-4 md:gap-5">
            <div className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]">
              <GiftIcon className="size-5" />
            </div>
            <p className="site-hero-eyebrow text-[var(--color-brand-blue)]">Fullness of Christ Church</p>
            <h1 className="site-hero-heading text-[2.5rem] text-[var(--color-text-strong)] md:text-[3.3rem]">
              First time<br /><span className="whitespace-nowrap">worshiping with us?</span>
            </h1>
            <p className="site-hero-intro max-w-[31rem] text-[var(--color-brand-blue)]">
              We’re glad you joined us. Share a few details so we can send you a special gift and help you stay connected.
            </p>
            <Link
              href="/fcc"
              className="site-button-text mt-1 inline-flex w-fit items-center gap-1.5 text-[0.85rem] font-semibold text-[var(--color-brand-blue)] underline decoration-[var(--color-brand-blue)]/35 underline-offset-4 transition-colors hover:decoration-current"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              Back to church locations
            </Link>
          </section>

          <section className="rounded-[1.25rem] bg-white p-5 shadow-[0_18px_45px_rgba(6,16,86,0.12)] ring-1 ring-[rgba(6,16,86,0.08)] sm:p-7">
            {submitted === "1" ? (
              <div className="grid gap-3 py-4 text-center">
                <p className="site-hero-eyebrow text-[var(--color-brand-blue)]">Thank you</p>
                <h2 className="site-section-heading text-[var(--color-text-strong)]">Your details are with us</h2>
                <p className="site-section-intro text-[var(--color-text-muted)]">
                  We’ll be in touch with your special gift.
                </p>
                <Link
                  href="/fcc"
                  className="site-button-text mt-3 inline-flex justify-center rounded-full bg-[var(--color-brand-blue)] px-5 py-3 text-[0.875rem] font-semibold text-white transition-colors hover:bg-[var(--color-brand-blue)]/90"
                >
                  Return to church page
                </Link>
              </div>
            ) : (
              <FirstTimeWorshipperForm welcomeEmail={welcomeAccess?.email ?? null} />
            )}
          </section>
        </div>
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
