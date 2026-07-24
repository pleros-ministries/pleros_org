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

const thankYouSectionPadding =
  "px-[var(--site-shell-padding-x)] md:px-[var(--site-shell-padding-x-md)] lg:px-[var(--site-shell-padding-x-lg)] xl:px-[var(--site-shell-padding-x-xl)]";

export function ThankYouPage({ name }: ThankYouPageProps) {
  const shareUrl = buildWelcomeShareIntentUrl(resolvePublicSiteUrl(process.env));

  return (
    <PublicSitePageShell minHeight>
        <HomepageNav />

        <main>
          <section className={`bg-[var(--color-brand-sky)] pb-8 pt-10 ${thankYouSectionPadding}`}>
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

          <section className={`bg-white py-10 ${thankYouSectionPadding}`}>
            <div className="grid gap-6 rounded-[1.375rem] bg-[var(--color-brand-lime)]/20 px-5 py-6 shadow-[inset_0_0_0_1px_rgba(5,20,128,0.08)]">
              <div className="grid gap-3">
                <h2 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                  Get TWO special gifts today, when you recommend this book
                  to others.
                </h2>
                <p className="site-section-intro max-w-[34ch] text-[var(--color-text-muted)]">
                  Help a friend, family, or stranger find the answer to
                  their greatest question.
                </p>
              </div>

              <div className="grid gap-2 text-[0.95rem] leading-[1.5] tracking-[-0.01em] text-[var(--color-text-strong)]">
                <p>
                  Many people walk in perpetual doubt and darkness about why
                  they exist.
                </p>
                <p>
                  It has led many into falsehood, all kinds of fleshly
                  bondages, and wasteful living.
                </p>
                <p>You can help put an end to that for someone today.</p>
              </div>

              <div className="grid gap-2 text-[0.95rem] leading-[1.5] tracking-[-0.01em] text-[var(--color-text-strong)]">
                <p>
                  Simply share the gift of purpose with them today, and set
                  them on course to fulfill God&apos;s will for their lives.
                </p>
                <p>
                  You can share the link across all social media platforms
                  using the buttons below:
                </p>
              </div>

              <a
                href={shareUrl}
                className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
              >
                <MessageCircleIcon className="size-4" />
                Share on WhatsApp
              </a>

              <div className="grid gap-2 text-[0.95rem] leading-[1.5] tracking-[-0.01em] text-[var(--color-text-strong)]">
                <p>
                  When you share this gift, we give you early access to two
                  of the most transformative books you may ever read and
                  that will help you fulfill God&apos;s purpose for you:
                </p>
                <ul className="grid list-disc gap-1 pl-5">
                  <li>Breaking Habits and Addictions as a New Creation</li>
                  <li>How the Gospel Proves Itself to Be the Truth</li>
                </ul>
              </div>

              <div className="grid gap-1 text-[0.95rem] font-semibold leading-[1.5] tracking-[-0.01em] text-[var(--color-brand-blue)]">
                <p>Don&apos;t postpone this.</p>
                <p>Someone&apos;s life and eternity may depend on it.</p>
                <p>Share God&apos;s gift of purpose with someone today.</p>
              </div>
            </div>
          </section>
        </main>

        <HomepageFooter />
    </PublicSitePageShell>
  );
}
