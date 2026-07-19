import { CheckCircle2Icon } from "lucide-react";
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

const welcomeBookExcerpts = [
  {
    number: "I",
    label: "Purpose requires revelation",
    excerpt:
      "You could tell what he made by observation and reason. But you can't tell why until he discloses it to you.",
    source: "Chapter I",
  },
  {
    number: "VII",
    label: "Natural assignment",
    excerpt:
      "Our natural pursuits should not be regarded as activities done merely for survival or personal ambition.",
    source: "Chapter VII",
  },
  {
    number: "IX",
    label: "Faith stand",
    excerpt:
      "It doesn't matter how low you have fallen, how far behind you feel you are, or how weak and inconsistent you might have been. Right now, you have all it takes to pursue God's will for you.",
    source: "Chapter IX",
  },
];

const welcomeBookBenefits = [
  "Clear, direct, straightforward and zero fluff or time wasting.",
  "30 pages of clarity, conviction and practical insight in God's Word.",
  "Early access to two extra materials prepared to strengthen your faith.",
];

function WelcomeGiftButton({
  hasWelcomeAccess,
}: {
  hasWelcomeAccess: boolean;
}) {
  if (hasWelcomeAccess) {
    return (
      <Link
        href="/thankyou"
        className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
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
      submitLabel="Get your free book"
      pendingLabel="Opening your gift"
    />
  );
}

export function WelcomeLandingPage({
  hasWelcomeAccess,
}: WelcomeLandingPageProps) {
  return (
    <PublicSitePageShell minHeight className="site-font-theme">
      <HomepageNav />

      <main>
        <section className="bg-[var(--color-brand-sky)]">
          <div className="site-shell-bar-inner grid gap-10 px-6 pb-12 pt-10 md:grid-cols-[minmax(0,1.04fr)_minmax(17rem,0.72fr)] md:items-center md:gap-12 md:pb-16 md:pt-14 lg:min-h-[34rem] lg:gap-16 lg:pb-20 lg:pt-18">
            <div className="grid gap-7">
              <div className="grid gap-5">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Free Pleros resource
                </p>
                <h1 className="site-hero-heading max-w-[11ch] text-[clamp(2.5rem,7vw,5.5rem)] text-[var(--color-brand-blue)] md:max-w-[10ch] md:leading-[0.92]">
                  Find the Answer to the Most Important Question of Your Life
                </h1>
                <p className="max-w-[34ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.72)] md:text-[1.08rem]">
                  You have not started living until you know what exactly you are to live for. And every second you waste without this answer is costing you progress in purpose.
                </p>
              </div>

              <WelcomeGiftButton hasWelcomeAccess={hasWelcomeAccess} />
            </div>

            <div className="relative hidden min-h-[25rem] items-end md:grid">
              <div className="absolute inset-x-8 top-0 h-[78%] bg-white/44 shadow-[inset_0_0_0_1px_rgba(6,16,86,0.08)]" />
              <div className="relative ml-auto grid w-full max-w-[21rem] gap-4 bg-[var(--color-brand-blue)] px-6 py-7 text-white shadow-[0_28px_70px_rgba(5,20,128,0.22)] lg:max-w-[24rem] lg:px-7 lg:py-8">
                <div className="relative mx-auto aspect-[0.707] w-[86%] max-w-[16rem] overflow-hidden bg-[var(--color-brand-blue)] shadow-[0_20px_44px_rgba(0,0,0,0.18)]">
                  <Image
                    src="/site/home/assets/welcome-pack-cards/welcome-book-cover.png"
                    alt=""
                    fill
                    className="object-contain"
                    sizes="13rem"
                    priority
                  />
                </div>
                <div className="grid gap-2">
                  <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-lime)]">
                    Welcome to purpose
                  </p>
                  <p className="font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-white/88">
                    A focused guide for clarity, conviction, and your next step in God&apos;s purpose.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="site-shell-bar-inner grid gap-8 px-6 py-10 md:py-14 lg:gap-10 lg:py-16">
            <div className="grid gap-3 md:max-w-[34rem]">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                Why this book
              </p>
              <h2 className="site-section-heading max-w-[13ch] text-[2rem] text-[var(--color-brand-blue)] md:text-[2.75rem] lg:text-[3.2rem]">
                Why you should get this book now
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              {welcomeBookBenefits.map((item) => (
                <div
                  key={item}
                  className="flex gap-3 border-t border-[rgba(6,16,86,0.12)] pt-4 font-[var(--font-be-vietnam-pro)] text-[0.92rem] font-medium leading-[1.35] tracking-[-0.02em] text-[rgba(6,16,86,0.76)] sm:min-h-[8.75rem] sm:flex-col sm:justify-between sm:bg-[var(--color-brand-sky-soft)] sm:px-4 sm:pb-4 md:text-[1rem]"
                >
                  <CheckCircle2Icon className="size-4 shrink-0 text-[var(--color-brand-blue)] sm:size-5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-sky-soft)]">
          <div className="site-shell-bar-inner grid gap-8 px-6 py-10 md:gap-10 md:py-14 lg:py-16">
            <div className="grid gap-3 md:grid-cols-[0.78fr_1fr] md:items-end md:gap-10">
              <div className="grid gap-3">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-blue)]">
                  Get a sneak peek
                </p>
                <h2 className="site-section-heading max-w-[12ch] text-[2.05rem] text-[var(--color-brand-blue)] md:text-[2.75rem]">
                  Selected excerpts from the book
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-brand-blue)]">
                <span className="h-px w-12 bg-[rgba(5,20,128,0.28)]" />
                <span className="font-[var(--font-be-vietnam-pro)] text-[0.8rem] font-semibold uppercase tracking-[0.16em]">
                  Preview
                </span>
                <span className="h-px flex-1 bg-[rgba(5,20,128,0.18)]" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {welcomeBookExcerpts.map(({ number, label, excerpt, source }) => (
                <div
                  key={number}
                  className="relative overflow-hidden bg-[#26326e] px-5 py-6 text-[#eef1fb] shadow-[0_18px_42px_rgba(20,28,70,0.18)] md:min-h-[22rem] md:px-5 md:py-7 lg:px-6"
                >
                  <div className="pointer-events-none absolute inset-3 border border-white/20" />
                  <div className="relative grid h-full gap-4 md:grid-rows-[auto_1fr_auto]">
                    <div className="grid justify-items-center gap-2 text-center">
                      <p className="font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#b9c4ec]">
                        {source}
                      </p>
                      <div className="text-[1.2rem] leading-none text-[#8fe63f]">✾</div>
                      <h3 className="site-section-heading text-[1.55rem] leading-[1.05] text-white">
                        {label}
                      </h3>
                      <div className="flex w-36 items-center justify-center gap-3 text-[#b9c4ec]">
                        <span className="h-px flex-1 bg-white/35" />
                        <span className="font-[var(--font-be-vietnam-pro)] text-[0.62rem] font-semibold uppercase tracking-[0.12em]">
                          Preview
                        </span>
                        <span className="h-px flex-1 bg-white/35" />
                      </div>
                    </div>

                    <p className="self-center px-2 text-center font-[var(--font-be-vietnam-pro)] text-[1rem] italic leading-[1.55] tracking-[-0.02em] text-[#d9e0f6]">
                      &ldquo;{excerpt}&rdquo;
                    </p>

                    <p className="text-center font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#b9c4ec]">
                      Excerpt {number}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="site-shell-bar-inner px-6 py-10 md:py-14 lg:py-16">
            <div className="grid gap-8 md:grid-cols-[0.88fr_1fr] md:items-center md:gap-12">
              <div className="grid gap-5">
                <h2 className="site-hero-heading max-w-[16ch] text-[clamp(2.35rem,6vw,4.5rem)] text-[var(--color-brand-blue)]">
                  It is absolutely free
                </h2>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.72)] md:text-[1.08rem]">
                  And there are several other gifts we have for you on your dashboard when you get this.
                </p>
                <WelcomeGiftButton hasWelcomeAccess={hasWelcomeAccess} />
              </div>

              <div className="grid gap-4 bg-[var(--color-brand-sky-soft)] px-5 py-6 shadow-[inset_0_0_0_1px_rgba(6,16,86,0.08)] md:px-7 md:py-8">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Your next step
                </p>
                <p className="font-[var(--font-be-vietnam-pro)] text-[1.05rem] leading-[1.45] tracking-[-0.02em] text-[rgba(6,16,86,0.76)]">
                  Receive the book, then continue into your dashboard for the welcome pack and guided resources.
                </p>
              </div>
            </div>
          </div>
        </section>

        <HomepageCommunitySection />
      </main>

      <HomepageFooter />
    </PublicSitePageShell>
  );
}
