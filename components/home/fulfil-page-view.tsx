import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fulfilPageCta,
  fulfilPageHero,
  fulfilPageIntro,
  fulfilPageLeadLines,
  fulfilPagePathwaySteps,
  fulfilPagePpcBenefits,
} from "@/lib/fulfil-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";

export function FulfilPageView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="relative overflow-hidden bg-[var(--color-brand-lime)]">
          <div className="relative flex min-h-[17.8125rem] flex-col justify-end px-[1.25rem] pb-[2.125rem] pt-10 md:min-h-[22rem] md:px-8 md:pb-[2.625rem] md:pt-12 xl:min-h-[25rem] xl:px-10 xl:pb-[3rem] xl:pt-14">
            <div className="relative z-10 grid max-w-[18.5rem] gap-3 md:max-w-[24rem] md:gap-4 xl:max-w-[31rem]">
              <p className="site-hero-eyebrow">{fulfilPageHero.eyebrow}</p>
              <h1 className="site-hero-heading max-w-[14rem] text-[2.8rem] text-[var(--color-brand-indigo)] md:max-w-[18rem] md:text-[3.6rem] xl:max-w-[24rem] xl:text-[4.15rem]">
                {fulfilPageHero.title}
              </h1>
              <p className="max-w-[18rem] text-[1.02rem] leading-[1.16] tracking-[-0.025em] text-[var(--color-brand-indigo)] md:max-w-[22rem] md:text-[1.18rem] xl:max-w-[26rem] xl:text-[1.28rem]">
                {fulfilPageHero.description}
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Button
                  size="lg"
                  render={
                    <Link
                      href={fulfilPageHero.primaryCtaHref}
                      className="site-button-text"
                    />
                  }
                  className="min-h-[2.875rem] rounded-full px-6 text-[0.875rem] font-semibold"
                >
                  {fulfilPageHero.primaryCtaLabel}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  render={
                    <Link
                      href={fulfilPageHero.secondaryCtaHref}
                      className="site-button-text"
                    />
                  }
                  className="min-h-[2.875rem] rounded-full px-6 text-[0.875rem] font-semibold"
                >
                  {fulfilPageHero.secondaryCtaLabel}
                </Button>
              </div>
            </div>

            <div className="pointer-events-none absolute bottom-[-0.15rem] right-[-0.75rem] h-[9rem] w-[12rem] md:bottom-[-0.75rem] md:right-[-0.9rem] md:h-[11.5rem] md:w-[15rem] xl:bottom-[-1rem] xl:right-[-1.25rem] xl:h-[14rem] xl:w-[18rem]">
              <Image
                src={fulfilPageHero.artworkSrc}
                alt=""
                fill
                className="object-contain object-right-bottom"
                sizes="(max-width: 767px) 12rem, (max-width: 1279px) 15rem, 18rem"
                priority
              />
            </div>
          </div>
        </section>

        <section className="bg-white px-[1.5rem] pb-[4.75rem] pt-[2.75rem] md:px-8 md:pb-16 md:pt-10 xl:px-10">
          <div className="mx-auto grid max-w-[35rem] gap-8 text-center md:gap-9">
            <div className="grid gap-0.5 text-[var(--color-text-strong)]">
              {fulfilPageLeadLines.map((line) => (
                <h2
                  key={line}
                  className="font-[var(--font-sen)] text-[2rem] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[2.7rem]"
                >
                  {line}
                </h2>
              ))}
            </div>

            <p className="text-[1rem] leading-[1.48] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.125rem]">
              {fulfilPageIntro}
            </p>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8 md:gap-10">
            <div className="grid gap-2 text-center">
              <p className="site-hero-eyebrow justify-center">The pathway</p>
              <h2 className="site-section-heading">How fulfilment takes shape</h2>
              <p className="mx-auto max-w-[34rem] text-[1rem] leading-[1.48] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.0625rem]">
                This is not a rush toward activity. It is a steady pathway of
                truth, prayer, obedience, and maturity.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {fulfilPagePathwaySteps.map((item) => (
                <Card
                  key={item.title}
                  tone="fulfil"
                  className="gap-4 rounded-[1.25rem] p-5 shadow-[0_12px_30px_rgba(70,102,60,0.08)]"
                >
                  <CardHeader className="gap-3 px-0 py-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-[3rem] shrink-0 items-center justify-center rounded-full bg-[var(--fulfil-accent)] text-[0.95rem] font-semibold tracking-[0.08em] text-white">
                        {item.step}
                      </div>
                      <CardTitle className="font-[var(--font-sen)] text-[1.5rem] leading-[1] tracking-[-0.045em] text-[var(--color-text-strong)]">
                        {item.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardDescription className="text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)]">
                    {item.description}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-start md:gap-10">
            <div className="grid gap-3">
              <Badge variant="fulfil" className="w-fit">
                PPC next step
              </Badge>
              <h2 className="site-section-heading max-w-[19rem]">
                PPC is where this pathway becomes more deliberate
              </h2>
              <p className="max-w-[24rem] text-[1rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.0625rem]">
                If Discover Purpose helped you see direction, PPC is the place
                to keep growing with more structure and follow-through.
              </p>
            </div>

            <div className="grid gap-4">
              {fulfilPagePpcBenefits.map((item) => (
                <Card
                  key={item.title}
                  className="gap-3 rounded-[1.25rem] border-[rgba(6,16,86,0.1)] bg-[var(--color-brand-sky-soft)] p-5 shadow-[0_12px_28px_rgba(6,16,86,0.05)]"
                >
                  <CardHeader className="gap-2 px-0 py-0">
                    <CardTitle className="font-[var(--font-sen)] text-[1.35rem] leading-[1.02] tracking-[-0.04em] text-[var(--color-brand-blue)]">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <p className="text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[rgba(1,21,133,0.78)]">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-blue)] px-[1.25rem] py-[4.25rem] text-white md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[44rem] gap-6 text-center">
            <p className="site-hero-eyebrow justify-center text-[var(--color-brand-lime)]">
              Next step
            </p>
            <h2 className="site-section-heading text-white">
              {fulfilPageCta.title}
            </h2>
            <p className="mx-auto max-w-[30rem] text-[1rem] leading-[1.5] tracking-[-0.02em] text-white/84 md:text-[1.125rem]">
              {fulfilPageCta.description}
            </p>

            <div className="flex justify-center pt-1">
              <Button
                size="lg"
                render={<Link href={fulfilPageCta.ctaHref} className="site-button-text" />}
                className="min-h-[2.875rem] rounded-full bg-white px-6 text-[0.875rem] font-semibold text-[var(--color-brand-blue)] hover:bg-white/92"
              >
                {fulfilPageCta.ctaLabel}
              </Button>
            </div>
          </div>
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
