import {
  CheckCircle2Icon,
  GiftIcon,
  MessageCircleIcon,
} from "lucide-react";
import Link from "next/link";

import { confirmWelcomePackShareAction } from "@/app/_actions/welcome-pack-actions";
import {
  buildWelcomeShareIntentUrl,
  resolvePublicSiteUrl,
} from "@/lib/welcome-campaign";

import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

type ThankYouPageProps = {
  extraGiftsUnlocked: boolean;
};

export function ThankYouPage({ extraGiftsUnlocked }: ThankYouPageProps) {
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
                  Your gift is ready
                </h1>
                <p className="max-w-[30ch] font-[var(--font-be-vietnam-pro)] text-[1rem] leading-[1.42] tracking-[-0.02em] text-[rgba(6,16,86,0.74)]">
                  Your dashboard access is ready. You can also unlock two extra
                  gifts by sharing this free resource with someone.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white px-6 py-10">
            <div className="grid gap-7 rounded-[1.375rem] bg-[var(--color-brand-lime)]/20 px-5 py-6 shadow-[inset_0_0_0_1px_rgba(5,20,128,0.08)]">
              <div className="grid gap-3">
                <h2 className="site-section-heading text-[2rem] text-[var(--color-brand-blue)]">
                  We have 2 more gifts for you but we need your help to share...
                </h2>
                <p className="max-w-[31ch] font-[var(--font-be-vietnam-pro)] text-[0.96rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  Tap the WhatsApp button to share the free gift. After sharing,
                  confirm here and we&apos;ll unlock the two extra resources.
                </p>
              </div>

              {extraGiftsUnlocked ? (
                <Link
                  href="/dashboard/welcomepack"
                  className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
                >
                  <CheckCircle2Icon className="size-4" />
                  Open unlocked gifts
                </Link>
              ) : (
                <div className="grid gap-3">
                  <a
                    href={shareUrl}
                    className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.22)]"
                  >
                    <MessageCircleIcon className="size-4" />
                    Claim Free Gifts
                  </a>

                  <form action={confirmWelcomePackShareAction}>
                    <button
                      type="submit"
                      className="site-button-text inline-flex min-h-[2.875rem] w-fit items-center justify-center rounded-full border border-[rgba(5,20,128,0.18)] bg-white px-7 py-2.5 text-[0.875rem] font-semibold leading-none text-[var(--color-brand-blue)] shadow-[0_10px_24px_rgba(5,20,128,0.08)]"
                    >
                      I&apos;ve shared
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white px-6 pb-10">
            <div className="grid gap-5 border-t border-[rgba(6,16,86,0.12)] pt-8">
              <div className="grid gap-2">
                <h2 className="site-section-heading text-[1.75rem] text-[var(--color-brand-blue)]">
                  Your main gift is already ready
                </h2>
                <p className="max-w-[31ch] font-[var(--font-be-vietnam-pro)] text-[0.96rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  Access your free gift on your dashboard whenever you&apos;re
                  ready.
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
