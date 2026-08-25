import { SendIcon, type LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  buildWelcomeShareMessage,
  buildWelcomeShareIntentUrl,
  resolvePublicSiteUrl,
} from "@/lib/welcome-campaign";
import { extraGifts } from "@/lib/welcome-pack-gifts";

import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";
import { ShareCopyLinkButton } from "./share-copy-link-button";

type ThankYouPageProps = {
  name?: string;
};

const thankYouSectionPadding =
  "px-[var(--site-shell-padding-x)] md:px-[var(--site-shell-padding-x-md)] lg:px-[var(--site-shell-padding-x-lg)] xl:px-[var(--site-shell-padding-x-xl)]";

const thankYouEyebrow = "site-hero-eyebrow text-[var(--color-brand-blue)]";
const thankYouBodyCopy = "site-section-intro text-[var(--color-text-muted)]";
const thankYouDarkBodyCopy = "site-section-intro text-white";
const thankYouCardHeading =
  "site-pathway-title text-[1.45rem] text-[var(--color-brand-lime)] md:text-[1.55rem]";
const shareJumpButtonBase =
  "site-button-text inline-flex min-h-[2.75rem] w-fit items-center justify-center rounded-full px-6 py-2.5 text-[0.8125rem] font-semibold leading-none transition-transform duration-150 hover:-translate-y-px";

function ShareStripJumpLink({
  tone = "blue",
}: {
  tone?: "blue" | "light" | "lime";
}) {
  const toneClass =
    tone === "light"
      ? "bg-white text-[var(--color-brand-blue)]"
      : tone === "lime"
        ? "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
        : "bg-[var(--color-brand-blue)] text-white shadow-[0_14px_28px_rgba(5,20,128,0.18)]";

  return (
    <a href="#share-gift" className={`${shareJumpButtonBase} ${toneClass}`}>
      Share this gift
    </a>
  );
}

function buildShareLinks(siteUrl: string) {
  const welcomeUrl = `${siteUrl}/welcome`;
  const shareText = buildWelcomeShareMessage(siteUrl);

  return [
    {
      label: "Share on WhatsApp",
      href: buildWelcomeShareIntentUrl(siteUrl),
      iconSrc: "/site/home/assets/social-media-icons/whatsapp-icon.svg",
    },
    {
      label: "Share on Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(welcomeUrl)}&text=${encodeURIComponent(shareText)}`,
      icon: SendIcon,
    },
    {
      label: "Share on Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(welcomeUrl)}`,
      iconSrc: "/site/home/assets/social-media-icons/facebook-icon.svg",
    },
    {
      label: "Share on X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(welcomeUrl)}&text=${encodeURIComponent(shareText)}`,
      iconSrc: "/site/home/assets/social-media-icons/x-icon.svg",
    },
    {
      label: "Share on Instagram DM",
      href: "https://www.instagram.com/direct/inbox/",
      iconSrc: "/site/home/assets/social-media-icons/instagram-icon.svg",
    },
    {
      label: "Share on TikTok DM",
      href: "https://www.tiktok.com/messages",
      iconSrc: "/site/home/assets/social-media-icons/tiktok-icon.svg",
    },
  ] satisfies Array<{
    label: string;
    href: string;
    icon?: LucideIcon;
    iconSrc?: string;
  }>;
}

export function ThankYouPage({ name }: ThankYouPageProps) {
  const siteUrl = resolvePublicSiteUrl(process.env);
  const welcomeUrl = `${siteUrl}/welcome`;
  const shareLinks = buildShareLinks(siteUrl);

  return (
    <PublicSitePageShell minHeight>
      <HomepageNav />

      <main>
        <section
          className={`bg-[var(--color-brand-sky)] py-9 md:py-11 ${thankYouSectionPadding}`}
        >
          <div className="mx-auto grid max-w-[72rem]">
            <div className="grid max-w-[30rem] gap-3">
              <p className="site-section-intro max-w-[31rem] text-[var(--color-text-strong)]">
                our gift is now available on your dashboard. You can access it at the end of this page.
              </p>
              {/* <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="#book-access"
                  className={`${shareJumpButtonBase} bg-[var(--color-brand-blue)] text-white shadow-[0_14px_28px_rgba(5,20,128,0.18)]`}
                >
                  Access your book
                </a>
              </div> */}
            </div>
          </div>
        </section>

        <section className={`bg-white py-14 md:py-20 ${thankYouSectionPadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-8">
            <div className="grid gap-4">
              <p className={thankYouEyebrow}>
                One more step
              </p>
              <h2 className="site-section-heading text-[var(--color-brand-blue)]">
                Get TWO special gifts today, when you recommend this book to
                others
              </h2>
              <p
                className={`${thankYouBodyCopy} max-w-[34rem] text-[var(--color-text-muted)]`}
              >
                Help a friend, family, or stranger find the answer to their
                greatest question.
              </p>
              <ShareStripJumpLink tone="blue" />
            </div>
          </div>
        </section>

        <section className={`bg-[var(--color-brand-blue)] py-14 text-white md:py-20 ${thankYouSectionPadding}`}>
          <div className="mx-auto grid max-w-[72rem] gap-8">
            <div className="grid gap-10 md:grid-cols-3 md:gap-8">
              <div className="grid content-start gap-3">
                <h3 className={thankYouCardHeading}>
                  Help end the darkness
                </h3>
                <div className={`grid gap-3 ${thankYouDarkBodyCopy}`}>
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
              </div>

              <div className="grid content-start gap-3">
                <h3 className={thankYouCardHeading}>
                  Share the gift of purpose
                </h3>
                <div className={`grid gap-3 ${thankYouDarkBodyCopy}`}>
                  <p>
                    Simply share the gift of purpose with them today, and set
                    them on course to fulfil God&apos;s will for their lives.
                  </p>
                  <p>
                    You can share the link across all social media platforms
                    using the buttons below:
                  </p>
                </div>
              </div>

              <div className="grid content-start gap-3">
                <h3 className={thankYouCardHeading}>
                  Receive two special books
                </h3>
                <div className={`grid gap-3 ${thankYouDarkBodyCopy}`}>
                  <p>
                    When you share this gift, we give you early access to two of
                    the most transformative books you may ever read, and they
                    will help you fulfil God&apos;s purpose for you:
                  </p>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {extraGifts.map((gift) => (
                      <figure key={gift.id} className="grid gap-2">
                        <Image
                          src={gift.imageSrc}
                          alt={gift.title}
                          width={506}
                          height={710}
                          sizes="(min-width: 768px) 16vw, 42vw"
                          className="h-auto w-full shadow-[0_16px_34px_rgba(0,0,0,0.18)]"
                        />
                        <figcaption className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] font-normal leading-[1.25] tracking-[-0.02em] text-white">
                          {gift.title}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <ShareStripJumpLink tone="lime" />
          </div>
        </section>

        <section
          id="share-gift"
          className={`scroll-mt-24 bg-[var(--color-brand-sky)] py-14 md:py-20 ${thankYouSectionPadding}`}
        >
          <div className="mx-auto grid max-w-[58rem] gap-7">
            <div className="grid gap-3">
              <p className={thankYouEyebrow}>
                Share the gift
              </p>
              <h2 className="site-section-heading text-[var(--color-brand-blue)]">
                Send the purpose book to someone today
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {shareLinks.map(({ label, href, icon: Icon, iconSrc }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.8125rem] font-semibold leading-none text-white shadow-[0_14px_28px_rgba(5,20,128,0.18)] transition-transform duration-150 hover:-translate-y-px"
                >
                  {Icon ? <Icon className="size-4" /> : null}
                  {iconSrc ? (
                    <Image
                      src={iconSrc}
                      alt=""
                      width={18}
                      height={18}
                      className="size-4"
                    />
                  ) : null}
                  {label}
                </a>
              ))}
              <ShareCopyLinkButton value={welcomeUrl} />
            </div>
          </div>
        </section>

        <section
          className={`bg-[var(--questions-surface)] py-14 md:py-20 ${thankYouSectionPadding}`}
        >
          <div className="mx-auto grid max-w-[58rem] gap-5 text-[var(--color-brand-blue)]">
            <div className="grid gap-4">
              <p className={thankYouEyebrow}>
                Today matters
              </p>
              <h2 className="site-section-heading text-[var(--color-brand-blue)]">
                Don&apos;t postpone this
              </h2>
              <div
                className={`grid gap-2 ${thankYouBodyCopy} text-[var(--color-brand-blue)]`}
              >
                <p>Someone&apos;s life and eternity may depend on it.</p>
                <p>Share God&apos;s gift of purpose with someone today.</p>
              </div>
              <ShareStripJumpLink tone="blue" />
            </div>
          </div>
        </section>

        <section
          id="book-access"
          className={`scroll-mt-24 bg-[var(--color-brand-sky)] pb-12 pt-9 md:pb-16 md:pt-12 ${thankYouSectionPadding}`}
        >
          <div className="mx-auto grid max-w-[72rem] gap-7">
            <div className="grid gap-4">
              <h2 className="site-hero-heading max-w-[13ch] text-[var(--color-brand-blue)]">
                {name
                  ? `Thank you for receiving our gift, ${name}`
                  : "Thank you for receiving our gift"}
              </h2>
              <p className="site-hero-intro max-w-[34ch] text-[var(--color-text-strong)]">
                Visit your dashboard to access your gift.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/dashboard/welcomepack"
                  className={`${shareJumpButtonBase} bg-[var(--color-brand-blue)] text-white shadow-[0_14px_28px_rgba(5,20,128,0.18)]`}
                >
                  Go to dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomepageFooter />
    </PublicSitePageShell>
  );
}
