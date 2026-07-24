import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { HomepageFooter } from "./homepage-footer";
import { HomepageGiftDrawer } from "./homepage-gift-drawer";
import { HomepageNav } from "./homepage-nav";
import { homeWhatsappChannelUrl } from "@/lib/site-homepage-content";

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

export function WelcomeLandingPage({
  hasWelcomeAccess,
}: WelcomeLandingPageProps) {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto min-h-screen w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)]">
        <HomepageNav />

        <main>
          <section className="bg-[var(--color-brand-sky)] px-6 pb-12 pt-10">
            <div className="grid gap-8">
              <div className="grid gap-5">
                {/* <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Free Pleros resource
                </p> */}
                <h1 className="site-hero-heading  text-[clamp(2.35rem,6vw,3.25rem)] text-[var(--color-brand-blue)]">
                  Find the Answer to the Most Important Question of Your Life
                </h1>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.72)]">
                  You have not started living until you know what exactly you are to live for.
                  And every second you waste without this answer is costing you progress in purpose.
                </p>
              </div>

              <div className="grid gap-5">
                {hasWelcomeAccess ? (
                  <Link
                    href="/thankyou"
                    className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
                  >
                    Get your free book
                  </Link>
                ) : (
                  <HomepageGiftDrawer
                    hasWelcomeAccess={hasWelcomeAccess}
                    autoOpen={false}
                    redirectTo="/thankyou"
                    triggerLabel="Get your free book"
                    submitLabel="Get your free book"
                    pendingLabel="Opening your gift"
                  />
                )}



              </div>
            </div>
          </section>

          <section className="bg-white px-6 py-10">
            <div className="grid gap-2 border-t border-[rgba(6,16,86,0.14)] pt-5">
              <h1 className="site-hero-heading  text-3xl text-[var(--color-brand-blue)]">
                Why You Should Get this Book Now:
              </h1>
              {[
                "Clear, Direct, Straightforward and Zero Fluff or Time wasting.",
                "30 pages of clarity, conviction and practical insight in God's Word",
                "Limited Opportunity to have early access to two material for free (Why You Should not be afraid of Hell and How the Gospel proves itself to be the Truth)",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 font-[var(--font-be-vietnam-pro)] text-[0.86rem] font-medium leading-[1.3] tracking-[-0.02em] text-[rgba(6,16,86,0.76)]"
                >
                  <CheckCircle2Icon className="size-4 shrink-0 text-[var(--color-brand-blue)]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

          </section>

          <section className="bg-[#d9d6cf] px-6 py-10">
            <div className="grid gap-8">
              <div className="grid gap-3">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-blue)]">
                  Get a sneak peek
                </p>
                <h2 className="site-section-heading max-w-[12ch] text-[2.05rem] text-[var(--color-brand-blue)]">
                  Selected excerpts from the book
                </h2>
                <div className="flex items-center gap-3 text-[var(--color-brand-blue)]">
                  <span className="h-px w-12 bg-[rgba(5,20,128,0.28)]" />
                  <span className="text-[0.9rem]">✦</span>
                  <span className="h-px flex-1 bg-[rgba(5,20,128,0.18)]" />
                </div>
              </div>

              <div className="grid gap-4">
                {welcomeBookExcerpts.map(({ number, label, excerpt, source }) => (
                  <div
                    key={number}
                    className="relative overflow-hidden bg-[#26326e] px-5 py-6 text-[#eef1fb] shadow-[0_18px_42px_rgba(20,28,70,0.18)]"
                  >
                    <div className="pointer-events-none absolute inset-3 border border-white/20" />
                    <div className="relative grid gap-4">
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
                          <span className="text-[0.75rem]">✦</span>
                          <span className="h-px flex-1 bg-white/35" />
                        </div>
                      </div>

                      <p className="px-2 text-center font-[var(--font-be-vietnam-pro)] text-[1rem] italic leading-[1.55] tracking-[-0.02em] text-[#d9e0f6]">
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

          <section className="bg-white px-6 py-10">

            <div className="grid gap-5 py-10">

              <h1 className="site-hero-heading max-w-[16ch] text-[clamp(2.35rem,6vw,3.25rem)] text-[var(--color-brand-blue)]">
                It is absolutely FREE!
              </h1>
              <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.72)]">
                And there are several other gifts we have for you on your dashboard when you get this.
              </p>
              {hasWelcomeAccess ? (
                <Link
                  href="/thankyou"
                  className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
                >
                  Get your free book
                </Link>
              ) : (
                <HomepageGiftDrawer
                  hasWelcomeAccess={hasWelcomeAccess}
                  autoOpen={false}
                  redirectTo="/thankyou"
                  triggerLabel="Get your free book"
                  submitLabel="Get your free book"
                  pendingLabel="Opening your gift"
                />
              )}

            </div>

            <div className="relative px-[1.3125rem] py-[4.5625rem] text-center text-white lg:px-16 lg:py-24">
              <div className="grid gap-[3.8125rem]">
                <div className="grid justify-items-center gap-[0.8125rem]">
                  <h2 className="site-section-heading max-w-[33.5625rem] text-white">
                    Join Pleros Community Channel
                  </h2>
                  <p className="site-section-intro max-w-[28.125rem] text-white/90">
                    This is a community open to anyone who desires edification via platforms of the Word and prayer designed to help you walk in and fulfill God&apos;s purpose daily.

                  </p>
                </div>

                <div className="flex justify-center">
                  <Link
                    href={homeWhatsappChannelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)]"
                  >
                    Join Now
                  </Link>
                </div>
              </div>
            </div>
          </section>

        </main>

        <HomepageFooter />
      </div>
    </div>
  );
}
