import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

import { DiscipleshipJourneyGallery } from "@/components/dashboard/discipleship-journey-gallery";
import type { DiscipleshipJourneySection } from "@/lib/discipleship-journey-content";

type DiscipleshipJourneyPageProps = {
  sections: DiscipleshipJourneySection[];
};

export function DiscipleshipJourneyPage({ sections }: DiscipleshipJourneyPageProps) {
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
          <h1 className="site-hero-heading max-w-[16ch] text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            Your Discipleship Journey
          </h1>
          <p className="font-[var(--font-be-vietnam-pro)] max-w-[34ch] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
            Watch every teaching from our Questions and Purpose series in one
            place.
          </p>
        </div>

        <DiscipleshipJourneyGallery sections={sections} />
      </div>
    </section>
  );
}
