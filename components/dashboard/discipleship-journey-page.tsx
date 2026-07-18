import Link from "next/link";
import Image from "next/image";
import { ChevronLeftIcon } from "lucide-react";

import {
  getDiscipleshipJourneySeriesCards,
  type DiscipleshipJourneySeriesCard,
} from "@/lib/discipleship-journey-content";

type DiscipleshipJourneyPageProps = {
  previewHrefPrefix?: string;
};

function DiscipleshipJourneySeriesGrid({
  cards,
}: {
  cards: DiscipleshipJourneySeriesCard[];
}) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:gap-7">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={card.href}
          className="group grid overflow-hidden rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="relative aspect-[0.78] overflow-hidden bg-[#d98d54]">
            <Image
              src={card.thumbnailSrc}
              alt=""
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-[1.015]"
              sizes="(max-width: 767px) calc((100vw - 4.75rem) / 2), 22rem"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,15,100,0.78)] via-[rgba(0,15,100,0.16)] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 grid gap-1.5 p-4 text-white sm:p-5">
              <h2 className="font-[var(--font-sen)] text-[1rem] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[1.2rem]">
                {card.title}
              </h2>
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-medium leading-[1.15] tracking-[-0.02em] text-white/86 sm:text-[0.82rem]">
                {card.videoCount} videos
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function DiscipleshipJourneyPage({
  previewHrefPrefix,
}: DiscipleshipJourneyPageProps) {
  const cards = getDiscipleshipJourneySeriesCards(previewHrefPrefix);

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

        <DiscipleshipJourneySeriesGrid cards={cards} />
      </div>
    </section>
  );
}
