import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  visionMissionHero,
  visionMissionLeadLines,
  visionMissionStatements,
} from "@/lib/vision-mission-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";

export function VisionMissionPageView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="bg-[#d2f1ff] px-[1.25rem] pb-[1.9rem] pt-[9.5rem] md:px-8 md:pb-10 md:pt-[11rem] xl:px-10 xl:pb-12">
          <div className="max-w-[24rem] md:max-w-[36rem]">
            <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.2rem] xl:text-[4rem]">
              {visionMissionHero.title}
            </h1>
            <p className="mt-2.5 text-[1rem] leading-[1.08] tracking-[-0.02em] text-[var(--color-brand-blue)] md:text-[1.15rem]">
              {visionMissionHero.subtitle}
            </p>
          </div>
        </section>

        <section className="bg-white px-5 pb-[4.75rem] pt-[2.75rem] md:px-8 md:pb-20 md:pt-10 xl:px-10">
          <div className="mx-auto grid max-w-[57rem] gap-8 md:gap-10">
            <div className="mx-auto grid max-w-[43rem] gap-1 text-center text-[var(--color-text-strong)]">
              {visionMissionLeadLines.map((line) => (
                <h2
                  key={line}
                  className="font-[var(--font-sen)] text-[1.55rem] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[2.05rem] xl:text-[2.3rem]"
                >
                  {line}
                </h2>
              ))}
            </div>

            {visionMissionStatements.map((statement) => (
              <section
                key={statement.title}
                className={`${statement.surfaceClassName} rounded-[1rem] px-6 py-7 md:grid md:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.2fr)] md:items-center md:gap-8 md:px-8 md:py-8`}
              >
                <h2 className="font-[var(--font-sen)] text-[2rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[var(--color-brand-blue)] md:text-[2.45rem]">
                  {statement.title}
                </h2>
                <p className="mt-4 text-[1rem] leading-[1.34] tracking-[-0.025em] text-[var(--color-brand-blue)] md:mt-0 md:text-[1.2rem]">
                  {statement.body}
                </p>
              </section>
            ))}

            <div className="flex justify-center pt-3">
              <Button
                size="lg"
                render={<Link href="/about" className="site-button-text" />}
                className="min-w-[12rem] rounded-full px-7 text-[0.875rem] font-semibold uppercase tracking-[0.02em]"
              >
                Back to about
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
