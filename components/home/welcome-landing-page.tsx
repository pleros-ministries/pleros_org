import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { HomepageFooter } from "./homepage-footer";
import { HomepageGiftDrawer } from "./homepage-gift-drawer";
import { HomepageNav } from "./homepage-nav";

type WelcomeLandingPageProps = {
  hasWelcomeAccess: boolean;
};

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
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Free Pleros resource
                </p>
                <h1 className="site-hero-heading max-w-[10ch] text-[clamp(2.35rem,6vw,3.25rem)] text-[var(--color-brand-blue)]">
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


                <div className="grid gap-2 border-t border-[rgba(6,16,86,0.14)] pt-5">
                  <h1 className="site-hero-heading  text-3xl text-[var(--color-brand-blue)]">
                    Why You Should Get this Book Now:
                  </h1>
                  {[
                    "Clear, Direct, Straightforward and Zero Fluff or Time wasting.",
                    "Just 15 pages of clarity, conviction and practical insight in God's Word",
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
              </div>
            </div>
          </section>

          {/* Sneak Peek Section */}
          <section className="bg-white px-6 py-10">
            <div className="grid gap-8">
              <div className="grid gap-2">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Get a sneak peek
                </p>
                <h2 className="site-section-heading text-[1.75rem] text-[var(--color-brand-blue)]">
                  3 snapshots of certain section of the book that function as cliffhangers.
                </h2>
                {/* <p className="font-[var(--font-be-vietnam-pro)] text-[0.93rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  It is absolutely free. These snapshots are deliberately
                  incomplete — each one stops right where it gets good.
                </p> */}
              </div>



              <div className="grid gap-4">
                {[
                  {
                    number: "01",
                    excerpt:
                      "Most people are not wasting time because they are lazy. They are wasting time because they have no idea what they are supposed to be doing with it. And without that answer, all your effort is just…",
                  },
                  {
                    number: "02",
                    excerpt:
                      "God does not give you a purpose the same way a job description is handed to you. It comes differently — through something most people completely overlook. The thing is, you have already seen the sign. You just did not know that…",
                  },
                  {
                    number: "03",
                    excerpt:
                      "There is a reason some people seem to wake up every day with energy, direction, and a strange kind of peace — even when their circumstances are not ideal. The difference is not talent, connections, or even faith. It is that they know the one thing that…",
                  },
                ].map(({ number, excerpt }) => (
                  <div
                    key={number}
                    className="relative overflow-hidden rounded-2xl border border-[rgba(6,16,86,0.10)] bg-[var(--color-bg)] px-5 py-5"
                  >
                    <p className="mb-2 font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--color-brand-blue)] opacity-40">
                      Excerpt {number}
                    </p>
                    <p className="font-[var(--font-be-vietnam-pro)] text-[0.91rem] italic leading-[1.6] tracking-[-0.01em] text-[rgba(6,16,86,0.76)]">
                      &ldquo;{excerpt}&rdquo;
                    </p>
                    {/* fade-out cliffhanger gradient */}
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--color-bg)] to-transparent" />
                    <p className="mt-1 font-[var(--font-be-vietnam-pro)] text-[0.8rem] font-semibold tracking-wide text-[var(--color-brand-blue)]">
                      — get the book to find out →
                    </p>
                  </div>
                ))}
              </div>

            </div>
            <div className="grid gap-5 py-10">

              <h1 className="site-hero-heading max-w-[10ch] text-[clamp(2.35rem,6vw,3.25rem)] text-[var(--color-brand-blue)]">
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


          </section>

        </main>

        <HomepageFooter />
      </div>
    </div>
  );
}
