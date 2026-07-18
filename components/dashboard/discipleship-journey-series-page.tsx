import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { DiscipleshipJourneyGallery } from "@/components/dashboard/discipleship-journey-gallery";
import type { DiscipleshipJourneySection } from "@/lib/discipleship-journey-content";

type DiscipleshipJourneySeriesPageProps = {
  section: DiscipleshipJourneySection;
  backHref?: string;
};

export function DiscipleshipJourneySeriesPage({
  section,
  backHref = "/dashboard/discipleship-journey",
}: DiscipleshipJourneySeriesPageProps) {
  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6">
      <div className="container-pleros grid max-w-[49rem] gap-8">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-blue)]"
        >
          <ChevronLeftIcon className="size-4" />
          Back to dashboard
        </Link>

        <div className="grid gap-2">
          <h1 className="site-hero-heading max-w-[16ch] text-[clamp(2.2rem,5.6vw,3.2rem)] text-[var(--color-brand-blue)]">
            {section.title}
          </h1>
          <p className="font-[var(--font-be-vietnam-pro)] max-w-[34ch] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
            Watch the teachings in this series from top to bottom.
          </p>
        </div>

        <DiscipleshipJourneyGallery sections={[section]} backHref={backHref} />
      </div>
    </section>
  );
}
