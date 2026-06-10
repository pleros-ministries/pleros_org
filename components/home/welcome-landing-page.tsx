import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

import { HomepageFooter } from "./homepage-footer";
import { HomepageGiftDrawer } from "./homepage-gift-drawer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

type WelcomeLandingPageProps = {
  hasWelcomeAccess: boolean;
};

export function WelcomeLandingPage({
  hasWelcomeAccess,
}: WelcomeLandingPageProps) {
  return (
    <PublicSitePageShell minHeight>
        <HomepageNav />

        <main>
          <section className="bg-[var(--color-brand-sky)] px-6 pb-12 pt-10">
            <div className="grid gap-8">
              <div className="grid gap-5">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Free Pleros resource
                </p>
                <h1 className="site-hero-heading max-w-[10ch] text-[clamp(2.35rem,6vw,3.25rem)] text-[var(--color-brand-blue)]">
                  Start your journey with a free book
                </h1>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.72)]">
                  Get instant dashboard access to the first Pleros resources for
                  growing in God&apos;s Word and purpose.
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
                    source="welcome"
                  />
                )}

                <div className="grid gap-2 border-t border-[rgba(6,16,86,0.14)] pt-5">
                  {[
                    "Access your welcome dashboard",
                    "Open your free gift immediately",
                    "Keep the resources available after you leave",
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

          <section className="bg-white px-6 py-10">
            <div className="grid gap-4">
              <h2 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                A focused first step
              </h2>
              <p className="max-w-[32ch] font-[var(--font-be-vietnam-pro)] text-[0.96rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                This gift is designed to help you begin with clarity before you
                move deeper into questions, purpose, and spiritual growth.
              </p>
            </div>
          </section>
        </main>

        <HomepageFooter />
    </PublicSitePageShell>
  );
}
