import Link from "next/link";

import { Button } from "@/components/ui/button";
import { partnerPageHero, partnerWhatsappHref } from "@/lib/partner-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PartnerGivingSections } from "./partner-giving-sections";
import { PublicSitePageShell } from "./public-site-page-shell";

export function PartnerPageView() {
  return (
    <PublicSitePageShell>
      <HomepageNav />

      <section className="bg-[var(--color-brand-sky)] px-[1.25rem] pb-[1.65rem] pt-[7rem] md:px-8 md:pb-10 md:pt-[8.5rem] xl:px-10 xl:pb-12">
        <div className="max-w-[22rem] md:max-w-[30rem]">
          <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.25rem] xl:text-[4rem]">
            {partnerPageHero.title}
          </h1>
          <p className="site-hero-intro mt-2.5 text-[var(--color-brand-blue)]">
            {partnerPageHero.description}
          </p>
        </div>
      </section>

      <section className="bg-white px-[1.5rem] pb-[3.25rem] pt-12 md:px-8 md:pb-12 md:pt-12 xl:px-10">
        <div className="mx-auto grid max-w-[44rem] justify-items-center gap-7 text-center md:gap-8">
          <p className="text-[1.05rem] leading-[1.42] tracking-[-0.03em] text-[var(--color-text-strong)] md:text-[1.35rem]">
            {partnerPageHero.intro}
          </p>

          <Button
            size="lg"
            render={
              <Link
                href={partnerWhatsappHref}
                className="site-button-text"
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            className="min-w-[12.875rem] rounded-full px-7 text-[0.875rem] font-semibold uppercase tracking-[0.02em]"
          >
            {partnerPageHero.ctaLabel}
          </Button>
        </div>
      </section>


      <PartnerGivingSections />

      <HomepageCommunitySection />
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
