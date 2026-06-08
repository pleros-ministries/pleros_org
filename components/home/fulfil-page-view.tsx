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
  fulfilPageLevels,
  fulfilPageReasons,
  fulfilPageStudentJourney,
} from "@/lib/fulfil-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";

export function FulfilPageView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="relative overflow-hidden bg-[var(--fulfil-surface)]">
          <div className="relative flex min-h-[15rem] flex-col justify-end px-[1.25rem] pb-[2.125rem] pt-10 md:min-h-[18rem] md:px-8 md:pb-[2.625rem] md:pt-12 xl:min-h-[19rem] xl:px-10 xl:pb-[3rem] xl:pt-14">
            <div className="relative z-10 grid max-w-[18rem] gap-3 md:max-w-[24rem] md:gap-4 xl:max-w-[34rem]">
              <p className="site-hero-eyebrow">{fulfilPageHero.eyebrow}</p>
              <h1 className="site-hero-heading max-w-[18rem] text-[2.8rem] text-[var(--fulfil-accent)] md:max-w-[26rem] md:text-[3.45rem] xl:max-w-[34rem] xl:text-[4rem]">
                {fulfilPageHero.title}
              </h1>
            </div>
          </div>
        </section>

        <section className="bg-white px-[1.5rem] pb-[4.75rem] pt-[2.75rem] md:px-8 md:pb-16 md:pt-10 xl:px-10">
          <div className="mx-auto grid max-w-[42rem] gap-4 text-center md:gap-5">
            <h2 className="font-[var(--font-sen)] text-[2rem] font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--color-text-strong)] md:text-[2.7rem]">
              {fulfilPageIntro.title}
            </h2>

            <p className="text-[1rem] leading-[1.48] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.125rem]">
              {fulfilPageIntro.description}
            </p>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8 md:gap-10">
            <div className="grid gap-2 text-center">
              <p className="site-hero-eyebrow justify-center">Start PPC</p>
              <h2 className="site-section-heading">What happens when you start</h2>
              <p className="mx-auto max-w-[34rem] text-[1rem] leading-[1.48] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.0625rem]">
                PPC is built for ordered growth through teaching, notes,
                response, and steady progress.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {fulfilPageStudentJourney.map((item) => (
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
                      <CardTitle className="font-[var(--font-sen)] text-[1.45rem] font-semibold leading-[1] tracking-[-0.045em] text-[var(--color-text-strong)]">
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

        <section
          id="levels"
          className="bg-white px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10"
        >
          <div className="mx-auto grid max-w-[58rem] gap-8">
            <div className="grid gap-2 text-center">
              <p className="site-hero-eyebrow justify-center">Course levels</p>
              <h2 className="site-section-heading">
                PPC moves through three levels
              </h2>
              <p className="mx-auto max-w-[34rem] text-[1rem] leading-[1.48] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.0625rem]">
                Each level carries its own focus and modules, helping you grow
                with clarity and order.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              {fulfilPageLevels.map((level) => (
                <Card
                  key={level.level}
                  tone="fulfil"
                  className="gap-5 rounded-[1.25rem] p-5 shadow-[0_12px_30px_rgba(70,102,60,0.08)]"
                >
                  <CardHeader className="gap-3 px-0 py-0">
                    <Badge variant="fulfil" className="w-fit">
                      {level.level}
                    </Badge>
                    <div className="grid gap-2">
                      <CardTitle className="font-[var(--font-sen)] text-[1.55rem] font-semibold leading-[1] tracking-[-0.045em] text-[var(--color-text-strong)]">
                        {level.title}
                      </CardTitle>
                      <CardDescription className="text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)]">
                        {level.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="px-0 pb-0">
                    <div className="grid gap-2 border-t border-[rgba(26,74,77,0.12)] pt-4">
                      {level.modules.map((module) => (
                        <div
                          key={module}
                          className="rounded-[0.875rem] bg-white/72 px-3 py-2.5 text-[0.93rem] leading-[1.35] tracking-[-0.02em] text-[var(--color-text-strong)]"
                        >
                          {module}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8 md:grid-cols-3">
            {fulfilPageReasons.map((item) => (
                <Card
                  key={item.title}
                  className="gap-4 rounded-[1.25rem] border-[rgba(6,16,86,0.1)] bg-white p-5 shadow-[0_12px_30px_rgba(6,16,86,0.06)]"
                >
                  <CardHeader className="gap-2 px-0 py-0">
                  <CardTitle className="font-[var(--font-sen)] text-[1.42rem] font-semibold leading-[1] tracking-[-0.04em] text-[var(--color-brand-indigo)]">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardDescription className="text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  {item.description}
                </CardDescription>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-[var(--color-brand-blue)] px-[1.25rem] py-[4.25rem] text-white md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[44rem] gap-6 text-center">
            <p className="site-hero-eyebrow justify-center text-white/72">
              PPC
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
                className="min-h-[2.875rem] rounded-full bg-white px-6 text-[0.875rem] font-semibold text-[var(--color-brand-blue)] hover:bg-white/92 hover:text-[var(--color-brand-blue)] focus-visible:text-[var(--color-brand-blue)]"
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
