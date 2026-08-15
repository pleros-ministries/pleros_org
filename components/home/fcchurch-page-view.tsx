import { BookOpenIcon, FlameKindlingIcon, MapPinIcon, PhoneIcon, SunIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import { Button } from "@/components/ui/button";
import {
  fcchurchAboutSection,
  fcchurchLocations,
  fcchurchOnlineSection,
  fcchurchPageHero,
  type FcchurchLocation,
  type ScheduleEntry,
} from "@/lib/fcchurch-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PublicSitePageShell } from "./public-site-page-shell";

// ─── Schedule row config ────────────────────────────────────────────────────

const scheduleConfig: Record<
  ScheduleEntry["type"],
  { label: string; icon: ComponentType<{ className?: string }>; pill: string }
> = {
  prayer: {
    label: "Prayer Meeting",
    icon: FlameKindlingIcon,
    pill: "bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]",
  },
  "bible-study": {
    label: "Bible Study",
    icon: BookOpenIcon,
    pill: "bg-[var(--purpose-surface)] text-[var(--purpose-accent)]",
  },
  sunday: {
    label: "Sunday Service",
    icon: SunIcon,
    pill: "bg-[var(--fulfil-surface)] text-[var(--fulfil-accent)]",
  },
};

// ─── Location Card ──────────────────────────────────────────────────────────

function FcchurchLocationCard({
  city,
  state,
  venueName,
  address,
  schedule,
  contacts,
}: FcchurchLocation) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_16px_44px_rgba(6,16,86,0.10)] ring-1 ring-[rgba(6,16,86,0.08)]">
      {/* Card header */}
      <div className="bg-[var(--color-brand-blue)] px-5 py-4 md:px-6">
        <span className="mb-2.5 inline-flex items-center gap-1 rounded-full bg-[var(--color-brand-lime)] px-2 py-0.5 font-[var(--font-be-vietnam-pro)] text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-blue)]">
          {state} State
        </span>
        <h3 className="font-[var(--font-sen)] text-[1.35rem] font-semibold leading-[1.05] tracking-[-0.04em] text-white">
          {city}
        </h3>
        <p className="mt-0.5 font-[var(--font-be-vietnam-pro)] text-[0.78rem] font-medium leading-[1.3] text-white/70">
          {venueName}
        </p>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2.5 border-b border-[rgba(6,16,86,0.08)] px-5 py-3.5 md:px-6">
        <MapPinIcon className="mt-0.5 size-[0.9rem] shrink-0 text-[var(--color-brand-blue)] opacity-60" />
        <p className="font-[var(--font-be-vietnam-pro)] text-[0.8rem] leading-[1.45] tracking-[-0.01em] text-[var(--color-text-muted)]">
          {address}
        </p>
      </div>

      {/* Schedule rows */}
      <div className="grid divide-y divide-[rgba(6,16,86,0.06)] px-5 py-1 md:px-6">
        {schedule.map((entry) => {
          const cfg = scheduleConfig[entry.type];
          const Icon = cfg.icon;
          return (
            <div key={entry.type} className="flex items-start gap-3 py-3">
              <div className={`mt-0.5 rounded-lg p-1.5 ${cfg.pill}`}>
                <Icon className="size-3.5" />
              </div>
              <div className="grid gap-0.5">
                <span className="font-[var(--font-be-vietnam-pro)] text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  {entry.label}
                </span>
                <span className="font-[var(--font-be-vietnam-pro)] text-[0.825rem] font-medium leading-[1.35] tracking-[-0.01em] text-[var(--color-text-strong)]">
                  {entry.time}
                </span>
                {entry.venue && (
                  <span className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] leading-[1.3] tracking-[-0.005em] text-[var(--color-text-muted)]">
                    {entry.venue}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Contacts */}
      <div className="mt-auto border-t border-[rgba(6,16,86,0.08)] bg-[var(--color-surface-muted)] px-5 py-4 md:px-6">
        <p className="mb-2 font-[var(--font-be-vietnam-pro)] text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Contact
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {contacts.map((c) => (
            <Link
              key={c.phone}
              href={c.href}
              className="group flex items-center gap-1.5 font-[var(--font-be-vietnam-pro)] text-[0.82rem] font-medium leading-none text-[var(--color-brand-blue)] transition-opacity hover:opacity-75"
            >
              <PhoneIcon className="size-3 shrink-0 opacity-60" />
              <span>
                {c.name !== contacts[0]?.name || contacts.length === 1
                  ? `${c.name} · `
                  : ""}
                {c.phone}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function FcchurchPageView() {
  return (
    <PublicSitePageShell>
      <HomepageNav />

      {/* Hero */}
      <section className="bg-[var(--color-brand-sky)] px-[1.25rem] pb-[2.5rem] pt-[7rem] md:px-8 md:pb-12 md:pt-[8.5rem] xl:px-10 xl:pb-14">
        <div className="max-w-[24rem] md:max-w-[32rem]">
          <h1 className="site-hero-heading text-[2.55rem] text-[var(--color-text-strong)] md:text-[3.25rem] xl:text-[4rem]">
            {fcchurchPageHero.title}
          </h1>
          <p className="site-hero-intro mt-3 max-w-[26rem] text-[var(--color-brand-blue)]">
            {fcchurchPageHero.description}
          </p>
        </div>
      </section>

      {/* About */}
      <section className="bg-white px-[1.25rem] py-[3.25rem] md:px-8 md:py-14 xl:px-10">
        <div className="mx-auto grid max-w-[46rem] gap-3 text-center">
          <p className="font-[var(--font-be-vietnam-pro)] text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-blue)]">
            {fcchurchAboutSection.eyebrow}
          </p>
          <h2 className="site-section-heading">
            {fcchurchAboutSection.title}
          </h2>
          <p className="site-section-intro mx-auto max-w-[38rem] text-[var(--color-text-muted)]">
            {fcchurchAboutSection.description}
          </p>
        </div>
      </section>

      {/* Locations */}
      <section className="bg-white px-[1.25rem] pb-[4.25rem] pt-8 md:px-8 md:pb-16 md:pt-10 xl:px-10">
        <div className="mx-auto grid max-w-[64rem] gap-10 md:gap-12">
          {/* Section header */}
          <div className="grid gap-2.5 text-center">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-blue)]">
              Locations
            </p>
            <h2 className="site-section-heading">Join us in person</h2>
            <p className="site-section-intro mx-auto max-w-[32rem] text-[var(--color-text-muted)]">
              We gather weekly for prayer, Bible study, and Sunday worship. Find
              a branch near you.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {fcchurchLocations.map((location) => (
              <FcchurchLocationCard key={location.id} {...location} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-brand-sky)] px-[1.25rem] py-8 md:px-8 md:py-11 xl:px-10">
        <div className="mx-auto flex max-w-[58rem] flex-col gap-4 rounded-[1.25rem] bg-white px-5 py-6 shadow-[0_14px_34px_rgba(6,16,86,0.08)] ring-1 ring-[rgba(6,16,86,0.08)] sm:px-7 sm:py-7 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="grid gap-1.5">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-blue)]">
              A welcome from us
            </p>
            <h2 className="font-[var(--font-sen)] text-[1.5rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--color-text-strong)]">
              First time worshiping with us?
            </h2>
            <p className="max-w-[34rem] font-[var(--font-be-vietnam-pro)] text-[0.9rem] leading-[1.5] text-[var(--color-text-muted)]">
              Fill this form so we can keep in touch with you.
            </p>
          </div>
          <Button
            size="lg"
            render={<Link href="/fcc/welcome" className="site-button-text" />}
            className="site-button-text inline-flex min-h-[2.875rem] shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-5 text-[0.875rem] font-semibold text-white hover:bg-[var(--color-brand-blue)]/90"
          >
            Fill the form
          </Button>
        </div>
      </section>

      {/* Online section */}
      <section className="bg-[var(--color-brand-blue)] px-[1.25rem] py-[4.25rem] text-white md:px-8 md:py-16 xl:px-10">
        <div className="mx-auto grid max-w-[58rem] gap-6 text-center">
          <div className="grid gap-2.5">
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-lime)]">
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
              className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)]"
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
