import {
  CircleCheckIcon,
  EyeIcon,
  HandHeartIcon,
  HeartIcon,
} from "lucide-react";
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

const visionMissionLeadIcons = [
  EyeIcon,
  HeartIcon,
  HandHeartIcon,
  CircleCheckIcon,
] as const;

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
            <ol className="mx-auto grid w-full max-w-[40rem] list-none gap-0 border-y border-[var(--color-line-strong)]">
              {visionMissionLeadLines.map((line, index) => {
                const Icon = visionMissionLeadIcons[index];

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

            {visionMissionStatements.map((statement) => (
              <section
                key={statement.title}
                className={`${statement.surfaceClassName} rounded-[1rem] px-6 py-6 md:px-8 md:py-7`}
              >
                <div className="grid gap-3 md:grid-cols-[10.5rem_minmax(0,1fr)] md:items-start md:gap-x-10">
                  <h2 className="font-[var(--font-sen)] text-[1.75rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--color-brand-blue)] md:pt-0.5 md:text-[2rem]">
                    {statement.title}
                  </h2>
                  <p className="text-left text-[0.9375rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-brand-blue)] md:border-l md:border-[rgba(1,21,133,0.14)] md:pl-8 md:text-[1.0625rem] md:leading-[1.5]">
                    {statement.body}
                  </p>
                </div>
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
