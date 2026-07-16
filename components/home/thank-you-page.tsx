import { GiftIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

import {
  buildWelcomeShareIntentUrl,
  resolvePublicSiteUrl,
} from "@/lib/welcome-campaign";

import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

type ThankYouPageProps = {
  name?: string;
};

export function ThankYouPage({ name }: ThankYouPageProps) {
  const shareUrl = buildWelcomeShareIntentUrl(resolvePublicSiteUrl(process.env));

  return (
    <PublicSitePageShell minHeight>
        <HomepageNav />

        <main>
          <section className="bg-[var(--color-brand-sky)] px-6 pb-8 pt-10">
            <div className="grid gap-6">
              <div className="grid gap-4">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Thank you
                </p>
                <h1 className="site-hero-heading max-w-[16ch] text-[clamp(2.35rem,6vw,3.2rem)] text-[var(--color-brand-blue)]">
                  {name
                    ? `Thank you for receiving your gift, ${name}.`
                    : "Thank you for receiving your gift."}
                </h1>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.74)]">
                  Visit your dashboard to access your gift.
                </p>
                <Link
                  href="/dashboard/welcomepack"
                  className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
                >
                  <GiftIcon className="size-4" />
                  Go to dashboard
                </Link>
              </div>
            </div>
          </section>

          <section className="bg-white px-6 py-10">
            <div className="grid gap-7 rounded-[1.375rem] bg-[var(--color-brand-lime)]/20 px-5 py-6 shadow-[inset_0_0_0_1px_rgba(5,20,128,0.08)]">
              <div className="grid gap-3">
                <h2 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                  Before you go, we have something more for you.
                </h2>
                <p className="site-section-intro max-w-[31ch] text-[var(--color-text-muted)]">
                  Share this with your circle. If two people access it
                  through your link, you unlock two extra gifts we&apos;ve
                  prepared for you.
                </p>
              </div>

              <a
                href={shareUrl}
                className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
              >
                <MessageCircleIcon className="size-4" />
                Share on WhatsApp
              </a>
            </div>
          </section>
        </main>

        <HomepageFooter />
    </PublicSitePageShell>
  );
}
