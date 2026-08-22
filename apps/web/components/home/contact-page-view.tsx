import {
  contactPageHero,
  contactPageIntro,
  contactPageLeadLines,
} from "@/lib/contact-page-content";

import { ContactForm } from "./contact-form";
import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

export function ContactPageView() {
  return (
    <PublicSitePageShell>
        <HomepageNav />

        <section className="bg-[#d2f1ff] px-[1.25rem] pb-[1.9rem] pt-[7rem] md:px-8 md:pb-10 md:pt-[8.5rem] xl:px-10 xl:pb-12">
          <div className="max-w-[28rem]">
            <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.2rem] xl:text-[4rem]">
              {contactPageHero.title}
            </h1>
            <p className="site-hero-intro mt-2.5 max-w-[34rem] text-[var(--color-brand-blue)]">
              {contactPageHero.description}
            </p>
          </div>
        </section>

        <section className="bg-white px-[1.4375rem] pb-[6.25rem] pt-[2.5rem] md:px-8 md:pb-20 md:pt-12 xl:px-10">
          <div className="mx-auto grid max-w-[23.75rem] gap-8 md:max-w-[30rem] md:gap-10">
            <div className="grid gap-4 text-center">
              <div className="grid gap-0.5 text-[var(--color-text-strong)]">
                {contactPageLeadLines.map((line) => (
                  <h2
                    key={line}
                    className="font-[var(--font-sen)] text-[2.1rem] font-semibold leading-[1.02] tracking-[-0.05em] md:text-[2.9rem]"
                  >
                    {line}
                  </h2>
                ))}
              </div>

              <p className="mx-auto max-w-[22rem] text-[0.95rem] leading-[1.32] tracking-[-0.02em] text-[var(--color-text-strong)] md:max-w-[26rem] md:text-[1.1rem]">
                {contactPageIntro}
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
    </PublicSitePageShell>
  );
}
