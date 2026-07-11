import {
  GiftIcon,
  MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";

import {
  buildWelcomeShareIntentUrl,
  resolvePublicSiteUrl,
} from "@/lib/welcome-campaign";

import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

type ThankYouPageProps = {
  downloadUrl: string;
};

export function ThankYouPage({ downloadUrl }: ThankYouPageProps) {
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
                <h1 className="site-hero-heading max-w-[10ch] text-[clamp(2.35rem,6vw,3.2rem)] text-[var(--color-brand-blue)]">
                  Your download has begun
                </h1>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.74)]">
                  We have started downloading your Pleros welcome pack. If it
                  does not start automatically, use the download link below. We
                  also sent the link to your email.
                </p>
                <a
                  href={downloadUrl}
                  className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full border border-[rgba(5,20,128,0.18)] bg-white px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-[var(--color-brand-blue)] shadow-[0_10px_24px_rgba(5,20,128,0.08)]"
                >
                  Download welcome pack
                </a>
              </div>
            </div>
          </section>

          <section className="bg-white px-6 py-10">
            <div className="grid gap-7 rounded-[1.375rem] bg-[var(--color-brand-lime)]/20 px-5 py-6 shadow-[inset_0_0_0_1px_rgba(5,20,128,0.08)]">
              <div className="grid gap-3">
                <h2 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                  Share this free gift with someone
                </h2>
                <p className="site-section-intro max-w-[31ch] text-[var(--color-text-muted)]">
                  We believe this resource would be a blessing to someone you
                  know. Kindly help share with them as well.
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

          <section className="bg-white px-6 pb-10">
            <div className="grid gap-5 border-t border-[rgba(6,16,86,0.12)] pt-8">
              <div className="grid gap-2">
                <h2 className="site-section-heading text-[1.75rem] text-[var(--color-brand-blue)]">
                  Continue to your dashboard
                </h2>
                <p className="site-section-intro max-w-[31ch] text-[var(--color-text-muted)]">
                  Your dashboard is ready when you want to keep exploring other
                  Pleros resources.
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
        </main>

        <HomepageFooter />
    </PublicSitePageShell>
  );
}
