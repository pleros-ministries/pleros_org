import Link from "next/link";

import { Button } from "@/components/ui/button";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import {
  aboutPageBody,
  aboutPageHero,
  aboutPageLeadLines,
} from "../../lib/about-page-content";

export function AboutPageView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="bg-[#d2f1ff] px-[1rem] pb-[1.75rem] pt-[7rem] md:px-6 md:pb-10 md:pt-[8.5rem] xl:px-8 xl:pb-12">
          <div className="max-w-[18rem]">
            <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.2rem] xl:text-[3.9rem]">
              {aboutPageHero.title}
            </h1>
            <p className="mt-2.5 text-[1rem] leading-[1.08] tracking-[-0.02em] text-[var(--color-brand-blue)] md:text-[1.15rem]">
              {aboutPageHero.description}
            </p>
          </div>
        </section>

        <section className="bg-white px-[1.75rem] pb-[5.75rem] pt-[3rem] md:px-8 md:pb-20 md:pt-14 xl:px-10">
          <div className="mx-auto grid max-w-[31rem] gap-8 text-center md:max-w-[35rem]">
            <div className="grid gap-0.5 text-[var(--color-text-strong)]">
              {aboutPageLeadLines.map((line) => (
                <h2
                  key={line}
                  className="font-[var(--font-sen)] text-[2rem] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[2.7rem]"
                >
                  {line}
                </h2>
              ))}
            </div>

            <div className="grid gap-6 text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1.125rem]">
              <p>{aboutPageBody[0]}</p>
              <p>
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
              <p>{aboutPageBody[2]}</p>
            </div>

            <div className="flex justify-center pt-2">
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

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
