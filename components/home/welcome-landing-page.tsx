import {
  BookOpenIcon,
  GiftIcon,
  HeadphonesIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageGiftDrawer } from "./homepage-gift-drawer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

type WelcomeLandingPageProps = {
  hasWelcomeAccess: boolean;
};

const welcomePagePadding =
  "px-[var(--site-shell-padding-x)] md:px-[var(--site-shell-padding-x-md)] lg:px-[var(--site-shell-padding-x-lg)] xl:px-[var(--site-shell-padding-x-xl)]";

const burdenPoints = [
  "We may have wasted or might be wasting our time and life right now if we do not know exactly why we exist and are not living for God's purpose.",
  "It is not unlikely that you have heard many generic answers that seem more like assumptions and guesses.",
  "But what we need is a clear, precise, and direct answer.",
];

const answerPoints = [
  "What we are offering is not a solution suggestion or a guess.",
  "What we offer is an exact and objective answer to the question of purpose.",
  "This book will lift all concerns, melt all doubts, and resolve the major questions you have about your purpose and pursuit of it.",
];

function WelcomeCta({
  hasWelcomeAccess,
  className = "",
}: {
  hasWelcomeAccess: boolean;
  className?: string;
}) {
  if (hasWelcomeAccess) {
    return (
      <Link
        href="/thankyou"
        className={`site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)] ${className}`}
      >
        Get your free book
      </Link>
    );
  }

  return (
    <HomepageGiftDrawer
      hasWelcomeAccess={hasWelcomeAccess}
      autoOpen={false}
      redirectTo="/thankyou"
      triggerLabel="Get your free book"
      eyebrowLabel="Book access"
      headline="Enter your email to get access"
      subheadline="Add your first name and email so we can grant you access now."
      submitLabel="Get your free book"
      pendingLabel="Opening your gift"
    />
  );
}

export function WelcomeLandingPage({
  hasWelcomeAccess,
}: WelcomeLandingPageProps) {
  return (
    <PublicSitePageShell minHeight>
      <HomepageNav />

      <main>
        <section className={`bg-white pb-14 pt-8 md:pb-20 md:pt-12 ${welcomePagePadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,24rem)] lg:items-center lg:gap-14">
            <div className="grid gap-7">
              <div>
                <h1 className="site-hero-heading !text-[2.25rem] text-[var(--color-brand-blue)] sm:!text-[2.85rem] md:!text-[3.65rem] lg:max-w-[13ch] lg:!text-[4.45rem]">
                  Find the Answer to the Most Important Question of Your Life
                </h1>
              </div>

              <div className="grid max-w-[41rem] gap-3 font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.025em] text-[var(--color-text-muted)] md:text-[1.2rem]">
                <p>
                  Simple, clear, direct, and precise answers to the question of
                  purpose and why you exist.
                </p>
                <p>
                  You will have zero doubts and guesses after you read this book.
                </p>
              </div>

              <div className="grid gap-5">
                <WelcomeCta hasWelcomeAccess={hasWelcomeAccess} />
              </div>
            </div>

            <div className="mx-auto w-full max-w-[18rem] sm:max-w-[20rem] lg:max-w-[24rem]">
              <div className="relative mx-auto aspect-[900/1275] w-[80%] max-w-[19rem]">
                <div className="absolute -bottom-7 left-[9%] right-[9%] h-12 rounded-[999px] bg-[rgba(6,16,86,0.18)] blur-2xl" />
                <div className="absolute inset-0 rounded-[1.8rem] bg-[linear-gradient(145deg,#2d385b,#111a39_42%,#060b22)] p-3 shadow-[0_34px_74px_rgba(6,16,86,0.25),0_12px_28px_rgba(6,16,86,0.16)] ring-1 ring-[rgba(6,16,86,0.2)]">
                  <div className="absolute left-1/2 top-1.5 z-10 size-1.5 -translate-x-1/2 rounded-full bg-[#64708f] shadow-[inset_0_1px_1px_rgba(255,255,255,0.45)] ring-1 ring-black/35" />
                  <div className="absolute inset-1 rounded-[1.55rem] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-10px_18px_rgba(0,0,0,0.2)]" />
                  <div className="relative h-full overflow-hidden rounded-[1.18rem] bg-[var(--color-brand-blue)] ring-1 ring-black/30">
                    <Image
                      src="/site/home/assets/welcome-pack-cards/welcome-book-cover.png"
                      alt="Welcome to Purpose book cover"
                      width={1488}
                      height={2105}
                      priority
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.2),rgba(255,255,255,0)_32%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.08))]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`bg-[var(--color-brand-sky)] py-14 md:py-20 ${welcomePagePadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] lg:gap-12">
            <div className="grid content-start gap-4">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-blue)]">
                Your greatest burden
              </p>
              <h2 className="site-section-heading max-w-[12ch] text-[2.45rem] text-[var(--color-brand-blue)] md:text-[3.6rem]">
                Why do we exist?
              </h2>
              <p className="site-section-intro max-w-[31rem] text-[var(--color-text-strong)]">
                The most troubling concern for all humans is the question of
                purpose.
              </p>
            </div>

            <div className="grid gap-3">
              {burdenPoints.map((point) => (
                <div
                  key={point}
                  className="border border-[rgba(6,16,86,0.1)] bg-white px-5 py-5 shadow-[0_16px_38px_rgba(6,16,86,0.08)]"
                >
                  <p className="font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`bg-[var(--color-brand-blue)] py-14 text-white md:py-20 ${welcomePagePadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
            <div className="grid gap-4">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-lime)]">
                Not a guess
              </p>
              <h2 className="site-section-heading text-white lg:max-w-[12ch]">
                An exact answer to purpose
              </h2>
            </div>

            <div className="grid gap-4">
              {answerPoints.map((point, index) => (
                <div
                  key={point}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)] gap-4 border border-[#3955ff]/65 bg-[#10229f] px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-brand-lime)] font-[var(--font-sen)] text-[0.95rem] font-semibold text-[var(--color-brand-blue)]">
                    {index + 1}
                  </div>
                  <p className="font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.45] tracking-[-0.02em] text-white/88">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`bg-white py-14 md:py-20 ${welcomePagePadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-center lg:gap-12">
            <div className="grid gap-5">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-blue)]">
                Absolutely free
              </p>
              <h2 className="site-section-heading max-w-[12ch] text-[var(--color-brand-blue)]">
                You need the answer now
              </h2>
              <div className="grid max-w-[40rem] gap-3 font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                <p>
                  The matters discussed and answered in this book are so
                  important that we cannot afford to put a price on it.
                </p>
                <p>
                  You need the answer now, and we want you to have it
                  immediately. So this book is absolutely free.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="grid gap-2 bg-[var(--color-surface-muted)] px-5 py-5">
                <BookOpenIcon className="size-5 text-[var(--color-brand-blue)]" />
                <p className="font-[var(--font-sen)] text-[1.35rem] leading-none tracking-[-0.04em] text-[var(--color-brand-blue)]">
                  25-30 minutes
                </p>
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.9rem] leading-[1.35] text-[var(--color-text-muted)]">
                  A slow-paced read for careful thought.
                </p>
              </div>
              <div className="grid gap-2 bg-[var(--color-brand-sky-soft)] px-5 py-5">
                <HeadphonesIcon className="size-5 text-[var(--color-brand-blue)]" />
                <p className="font-[var(--font-sen)] text-[1.35rem] leading-none tracking-[-0.04em] text-[var(--color-brand-blue)]">
                  45 minutes
                </p>
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.9rem] leading-[1.35] text-[var(--color-text-muted)]">
                  Also available in audio format.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`bg-[var(--color-surface-muted)] py-14 md:py-20 ${welcomePagePadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12">
            <div className="grid gap-4">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-blue)]">
                Two more gifts
              </p>
              <h2 className="site-section-heading max-w-[13ch] text-[var(--color-brand-blue)]">
                There is more waiting for you
              </h2>
            </div>

            <div className="grid gap-5 bg-white px-5 py-6 shadow-[0_20px_48px_rgba(6,16,86,0.08)] md:px-7 md:py-8">
              <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]">
                <GiftIcon className="size-5" />
              </div>
              <div className="grid gap-3 font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                <p>
                  Aside from getting this book for free, we have two other
                  special gifts for you.
                </p>
                <p>
                  If you get this book today and recommend it to others, you
                  will access our special gift for you.
                </p>
              </div>
              <WelcomeCta hasWelcomeAccess={hasWelcomeAccess} />
            </div>
          </div>
        </section>

        <section className={`bg-white py-14 md:py-20 ${welcomePagePadding}`}>
          <div className="mx-auto grid max-w-[58rem] gap-5 text-center">
            <h2 className="site-section-heading text-[var(--color-brand-blue)]">
              No more guessing about why you exist
            </h2>
            <p className="site-section-intro mx-auto max-w-[38rem] text-[var(--color-text-muted)]">
              The answer to purpose is too important to leave vague. Get the
              book now and begin from clarity.
            </p>
            <div className="flex justify-center">
              <WelcomeCta hasWelcomeAccess={hasWelcomeAccess} />
            </div>
          </div>
        </section>

        <HomepageCommunitySection />
      </main>

      <HomepageFooter />
    </PublicSitePageShell>
  );
}
