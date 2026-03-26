import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  partnerImpactItems,
  partnerPageCta,
  partnerPageHero,
  partnerReasons,
} from "@/lib/partner-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";

function PartnerReasonCard({
  step,
  title,
  description,
}: (typeof partnerReasons)[number]) {
  return (
    <Card className="gap-0 rounded-[1.25rem] border-[rgba(6,16,86,0.14)] bg-white p-0 shadow-[0_16px_40px_rgba(6,16,86,0.08)]">
      <CardHeader className="gap-4 px-5 pb-3 pt-5 md:px-6 md:pt-6">
        <div className="flex items-center gap-3">
          <div className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-[1.375rem] font-semibold leading-none text-white">
            {step}
          </div>
          <CardTitle className="font-[var(--font-sen)] text-[1.6rem] leading-[0.95] tracking-[-0.05em] text-[var(--color-brand-indigo)]">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 md:px-6 md:pb-6">
        <CardDescription className="text-[1rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

export function PartnerPageView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="bg-[var(--color-brand-sky)] px-[1.25rem] pb-[1.65rem] pt-[7rem] md:px-8 md:pb-10 md:pt-[8.5rem] xl:px-10 xl:pb-12">
          <div className="max-w-[22rem] md:max-w-[30rem]">
            <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.25rem] xl:text-[4rem]">
              {partnerPageHero.title}
            </h1>
            <p className="mt-2.5 text-[1rem] leading-[1.08] tracking-[-0.02em] text-[var(--color-brand-blue)] md:text-[1.15rem] xl:text-[1.25rem]">
              {partnerPageHero.description}
            </p>
          </div>
        </section>

        <section className="bg-white px-[1.5rem] pb-[4.75rem] pt-[1.75rem] md:px-8 md:pb-16 md:pt-10 xl:px-10">
          <div className="mx-auto grid max-w-[44rem] justify-items-center gap-7 text-center md:gap-8">
            <p className="text-[1.05rem] leading-[1.42] tracking-[-0.03em] text-[var(--color-text-strong)] md:text-[1.35rem]">
              {partnerPageHero.intro}
            </p>

            <Button
              size="lg"
              render={
                <Link href="#become-a-partner" className="site-button-text" />
              }
              className="min-w-[12.875rem] rounded-full px-7 text-[0.875rem] font-semibold uppercase tracking-[0.02em]"
            >
              {partnerPageHero.ctaLabel}
            </Button>
          </div>
        </section>

        <section className="bg-[var(--color-surface-muted)] px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8 md:gap-10">
            <div className="grid gap-2 text-center">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-blue)]">
                Partnership
              </p>
              <h2 className="site-section-heading">Why partner with Pleros</h2>
              <p className="mx-auto max-w-[33rem] text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1.0625rem]">
                Partnership is a practical way to join the work God is doing
                through Pleros across teaching, discipleship, outreach, and
                digital ministry.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {partnerReasons.map((reason) => (
                <PartnerReasonCard key={reason.title} {...reason} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--color-brand-blue)] px-[1.25rem] py-[4.25rem] text-white md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:items-start md:gap-10">
            <div className="grid gap-3">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-lime)]">
                Stewardship
              </p>
              <h2 className="site-section-heading text-white">
                What your partnership makes possible
              </h2>
              <p className="text-[1rem] leading-[1.5] tracking-[-0.02em] text-white/80 md:text-[1.0625rem]">
                Every gift helps strengthen real ministry work that reaches
                people, supports growth, and keeps Gospel resources moving.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {partnerImpactItems.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.125rem] border border-white/12 bg-white/8 px-4 py-5 backdrop-blur-[2px]"
                >
                  <p className="font-[var(--font-sen)] text-[1.25rem] leading-[1.02] tracking-[-0.04em] text-white">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="become-a-partner"
          className="bg-white px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10"
        >
          <div className="mx-auto max-w-[52rem]">
            <Card className="gap-6 rounded-[1.5rem] border-[rgba(6,16,86,0.12)] bg-[linear-gradient(180deg,#f4f9ff_0%,#dff3ff_100%)] px-6 py-7 shadow-[0_20px_44px_rgba(6,16,86,0.08)] md:px-8 md:py-9">
              <CardHeader className="gap-3 px-0 py-0 text-center">
                <p className="font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-blue)]">
                  Next step
                </p>
                <CardTitle className="site-section-heading">
                  {partnerPageCta.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-6 px-0 pb-0 text-center">
                <p className="mx-auto max-w-[35rem] text-[1rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.125rem]">
                  {partnerPageCta.description}
                </p>

                <div className="flex justify-center">
                  <Button
                    size="lg"
                    render={<Link href="#" className="site-button-text" />}
                    className="min-w-[12.875rem] rounded-full px-7 text-[0.875rem] font-semibold uppercase tracking-[0.02em]"
                  >
                    {partnerPageCta.ctaLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
