import { CompassIcon, FlameIcon, UsersRoundIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";
import {
  aboutPageBody,
  aboutPageHero,
  aboutPageLeadLines,
  aboutPageMinisterFollow,
} from "../../lib/about-page-content";
import {
  footerSocialLinks,
  type HomeSocialLink,
} from "../../lib/site-homepage-content";

const aboutPageLeadIcons = [UsersRoundIcon, CompassIcon, FlameIcon] as const;

function FollowSocialCard({
  media,
  eyebrow,
  title,
  handle,
  links,
}: {
  media: React.ReactNode;
  eyebrow?: string;
  title: string;
  handle: string;
  links: readonly HomeSocialLink[];
}) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_16px_40px_rgba(6,16,86,0.08)]">
      {media}
      <div className="grid gap-3 p-5 md:p-6">
        <div>
          {eyebrow ? (
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.3] text-[var(--color-text-strong)]">
              {eyebrow}
            </p>
          ) : null}
          <p className="font-[var(--font-be-vietnam-pro)] text-[1.4rem] font-bold leading-[1.15] tracking-[-0.03em] text-[var(--color-brand-indigo)]">
            {title}
          </p>
          <p className="mt-1 text-[0.9375rem] text-[var(--color-text-muted)]">
            {handle}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              className="flex size-10 items-center justify-center rounded-full bg-[var(--color-brand-blue)] transition-opacity duration-150 hover:opacity-85"
            >
              <Image
                src={link.iconSrc}
                alt=""
                width={18}
                height={18}
                className="h-[1.125rem] w-[1.125rem]"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutPageView() {
  return (
    <PublicSitePageShell>
      <HomepageNav />

      <section className="bg-[#d2f1ff] px-[1.25rem] pb-[1.9rem] pt-[7rem] md:px-8 md:pb-10 md:pt-[8.5rem] xl:px-10 xl:pb-12">
        <div className="max-w-[24rem] md:max-w-[30rem]">
          <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.2rem] xl:text-[3.9rem]">
            {aboutPageHero.title}
          </h1>
          <p className="site-hero-intro mt-2.5 text-[var(--color-brand-blue)]">
            {aboutPageHero.description}
          </p>
        </div>
      </section>

      <section className="bg-white px-5 pb-[4.75rem] pt-[2.75rem] md:px-8 md:pb-20 md:pt-10 xl:px-10">
        <div className="mx-auto grid max-w-[57rem] gap-8 md:gap-10">
          <ol className="mx-auto grid w-full max-w-[40rem] list-none gap-0 border-y border-[var(--color-line-strong)]">
            {aboutPageLeadLines.map((line, index) => {
              const Icon = aboutPageLeadIcons[index];

              return (
                <li
                  key={line}
                  className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-start gap-x-4 border-b border-[var(--color-line)] py-4 last:border-b-0 md:gap-x-5 md:py-5"
                >
                  <Icon
                    className="mt-1 size-[1.125rem] shrink-0 text-[var(--color-brand-blue)]"
                    aria-hidden
                  />
                  <p className="font-[var(--font-sen)] text-[1.55rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--color-brand-blue)] md:text-[1.75rem]">
                    {line}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="mx-auto grid w-full max-w-[40rem] gap-6 text-left text-[0.9375rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.0625rem]">
            <p>{aboutPageBody[0]}</p>

            <div className="rounded-[1rem] bg-[var(--color-brand-sky-soft)] px-5 py-5 md:px-6 md:py-6">
              <p className="text-[var(--color-brand-blue)]">
                <span>{'The word "'}</span>
                <strong className="font-semibold">Pleros</strong>
                <span>{'" is a coinage from the Greek words: '}</span>
                <strong className="font-semibold">Pleroma</strong>
                <span>{" (Fullness), "}</span>
                <strong className="font-semibold">Pleres</strong>
                <span>{" (full), "}</span>
                <strong className="font-semibold">Pleroo</strong>
                <span>{" (fulfill)."}</span>
              </p>
            </div>

            <p>{aboutPageBody[2]}</p>
          </div>

          <div className="flex justify-center pt-1">
            <Button
              size="lg"
              render={
                <Link href="/vision-and-mission" className="site-button-text" />
              }
              className="min-w-[12.25rem] rounded-full px-7 text-[0.875rem] font-semibold uppercase tracking-[0.02em]"
            >
              Vision & Mission
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface-muted)] px-5 py-[3.5rem] md:px-8 md:py-16 xl:px-10">
        <div className="mx-auto grid max-w-[44rem] gap-6 md:grid-cols-2 md:gap-8">
          <FollowSocialCard
            media={
              <div className="relative aspect-[3/3] w-full">
                <Image
                  src="/assets/home/pastor.jpg"
                  alt={aboutPageMinisterFollow.name}
                  fill
                  className="object-top object-cover"
                />
              </div>
            }
            eyebrow="Follow our Senior Minister,"
            title={aboutPageMinisterFollow.name}
            handle={aboutPageMinisterFollow.handle}
            links={aboutPageMinisterFollow.links}
          />
          <FollowSocialCard
            media={
              <div className="relative flex aspect-[3/3] w-full items-center justify-center bg-[var(--color-brand-blue)]">
                <Image
                  src="/site/home/assets/pleros-wordmark.webp"
                  alt="Pleros"
                  width={190}
                  height={92}
                  className="h-auto w-[9.5rem]"
                />
              </div>
            }
            title="Follow us on social media"
            handle="@pleros_org"
            links={footerSocialLinks}
          />
        </div>
      </section>

      <HomepageCommunitySection />
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
