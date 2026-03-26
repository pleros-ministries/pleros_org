import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  contactFormFields,
  contactMessagePlaceholder,
  contactPageHero,
  contactPageIntro,
  contactPageLeadLines,
  contactSubmitLabel,
} from "@/lib/contact-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";

export function ContactPageView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="bg-[#d2f1ff] px-[1.25rem] pb-[1.9rem] pt-[7rem] md:px-8 md:pb-10 md:pt-[8.5rem] xl:px-10 xl:pb-12">
          <div className="max-w-[28rem]">
            <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.2rem] xl:text-[4rem]">
              {contactPageHero.title}
            </h1>
            <p className="mt-2.5 max-w-[34rem] text-[1rem] leading-[1.08] tracking-[-0.02em] text-[var(--color-brand-blue)] md:text-[1.15rem]">
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

            <form className="grid gap-3.5" action="#">
              {contactFormFields.map((field) => (
                <Input
                  key={field.id}
                  id={field.id}
                  type={field.type}
                  placeholder={field.placeholder}
                  aria-label={field.placeholder}
                  className="h-[2.6875rem] rounded-[0.75rem] border-[rgba(6,16,86,0.12)] px-4 text-[0.875rem] text-[var(--color-text-strong)] placeholder:text-[rgba(6,16,86,0.55)]"
                />
              ))}

              <textarea
                id="message"
                name="message"
                placeholder={contactMessagePlaceholder}
                aria-label={contactMessagePlaceholder}
                className="min-h-[6.875rem] w-full rounded-[0.75rem] border border-[rgba(6,16,86,0.12)] bg-white px-4 py-3 text-[0.875rem] text-[var(--color-text-strong)] outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-[rgba(6,16,86,0.55)] focus-visible:border-[var(--color-brand-blue)] focus-visible:ring-4 focus-visible:ring-[var(--color-focus)] md:min-h-[8rem]"
              />

              <Button
                type="button"
                size="lg"
                className="mt-1 min-h-[2.875rem] w-full rounded-full px-6 text-[0.875rem] font-semibold tracking-[0.02em]"
              >
                {contactSubmitLabel}
              </Button>
            </form>
          </div>
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
