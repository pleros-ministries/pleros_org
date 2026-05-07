import { GiftIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

import {
  buildWelcomeShareIntentUrl,
  resolvePublicSiteUrl,
} from "@/lib/welcome-campaign";

import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";

export function ThankYouPage() {
  const shareUrl = buildWelcomeShareIntentUrl(resolvePublicSiteUrl(process.env));

  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto min-h-screen w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)]">
        <HomepageNav />

        <main>
          <section className="bg-[var(--color-brand-sky)] px-6 pb-10 pt-10">
            <div className="grid gap-7">
              <div className="grid gap-4">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-blue)]">
                  Thank you
                </p>
                <h1 className="site-hero-heading max-w-[10ch] text-[clamp(2.35rem,6vw,3.2rem)] text-[var(--color-brand-blue)]">
                  Your gift is ready
                </h1>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.74)]">
                  Access your free gift on your dashboard.
                </p>
              </div>

              <Link
                href="/dashboard/welcomepack"
                className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
              >
                <GiftIcon className="size-4" />
                Open dashboard
              </Link>
            </div>
          </section>

          <section className="bg-white px-6 py-10">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <h2 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                  We have 2 more gifts for you but we need your help to share...
                </h2>
                <p className="max-w-[31ch] font-[var(--font-be-vietnam-pro)] text-[0.96rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  Share this free gift with someone on WhatsApp, then come back
                  to claim the next resources.
                </p>
              </div>

              <a
                href={shareUrl}
                className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
              >
                <MessageCircleIcon className="size-4" />
                Claim Free Gifts
              </a>
            </div>
          </section>
        </main>

        <HomepageFooter />
      </div>
    </div>
  );
}
