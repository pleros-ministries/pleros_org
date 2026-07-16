import { ClockIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  fcchurchLocations,
  fcchurchOnlineSection,
  fcchurchPageHero,
  type FcchurchLocation,
} from "@/lib/fcchurch-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

function FcchurchLocationCard({
  venueName,
  address,
  serviceTime,
  contactLabel,
  contactHref,
}: FcchurchLocation) {
  return (
    <Card className="gap-4 rounded-[1.25rem] border-[rgba(6,16,86,0.14)] bg-white p-5 shadow-[0_16px_40px_rgba(6,16,86,0.08)] md:p-6">
      <CardHeader className="gap-1 px-0 py-0">
        <CardTitle className="font-[var(--font-sen)] text-[1.375rem] leading-[0.95] tracking-[-0.05em] text-[var(--color-brand-indigo)]">
          {venueName}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-0 pb-0">
        <div className="flex items-start gap-2.5">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-blue)]" />
          <p className="text-[1rem] leading-[1.4] text-[var(--color-text-strong)]">
            {address}
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-blue)]" />
          <p className="text-[1rem] leading-[1.4] text-[var(--color-text-strong)]">
            {serviceTime}
          </p>
        </div>
        <Link
          href={contactHref}
          className="flex w-fit items-center gap-2.5 text-[1rem] font-medium leading-[1.4] text-[var(--color-brand-blue)] hover:underline"
        >
          <PhoneIcon className="size-4 shrink-0" />
          {contactLabel}
        </Link>
      </CardContent>
    </Card>
  );
}

export function FcchurchPageView() {
  return (
    <PublicSitePageShell>
      <HomepageNav />

      <section className="bg-[var(--color-brand-sky)] px-[1.25rem] pb-[1.65rem] pt-[7rem] md:px-8 md:pb-10 md:pt-[8.5rem] xl:px-10 xl:pb-12">
        <div className="max-w-[22rem] md:max-w-[30rem]">
          <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.25rem] xl:text-[4rem]">
            {fcchurchPageHero.title}
          </h1>
          <p className="site-hero-intro mt-2.5 text-[var(--color-brand-blue)]">
            {fcchurchPageHero.description}
          </p>
        </div>
      </section>

      <section className="bg-white px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
        <div className="mx-auto grid max-w-[58rem] gap-8 md:gap-10">
          <div className="grid gap-2 text-center">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-blue)]">
              Locations
            </p>
            <h2 className="site-section-heading">Join us in person</h2>
            <p className="site-section-intro mx-auto max-w-[33rem] text-[var(--color-text-muted)]">
              We would love to have you worship with us. Find a location
              near you below.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            {fcchurchLocations.map((location) => (
              <FcchurchLocationCard key={location.id} {...location} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-brand-blue)] px-[1.25rem] py-[4.25rem] text-white md:px-8 md:py-16 xl:px-10">
        <div className="mx-auto grid max-w-[58rem] gap-6 text-center">
          <div className="grid gap-2">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-lime)]">
              {fcchurchOnlineSection.eyebrow}
            </p>
            <h2 className="site-section-heading text-white">
              {fcchurchOnlineSection.title}
            </h2>
            <p className="site-section-intro mx-auto max-w-[33rem] text-white/80">
              {fcchurchOnlineSection.description}
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              render={
                <Link
                  href={fcchurchOnlineSection.streamHref}
                  className="site-button-text"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              className="min-w-[12.875rem] bg-[var(--color-brand-lime)] rounded-full px-7 text-[0.875rem] font-semibold uppercase tracking-[0.02em]"
            >
              {fcchurchOnlineSection.streamLabel}
            </Button>
          </div>
        </div>
      </section>

      <HomepageCommunitySection />
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
