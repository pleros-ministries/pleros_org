import Link from "next/link";

import { HomepagePathwayCard } from "./homepage-pathway-card";
import { homePathwayCards } from "../../lib/site-homepage-content";

export function HomepageHero() {
  return (
    <>
      <section className="bg-[var(--color-brand-sky)] px-6 pb-[2.75rem] pt-[1.125rem]">
        <div className="grid justify-items-center gap-3 text-center">
          <p className="site-hero-eyebrow">
            Pleros ministries &amp; missions
          </p>
          <h1 className="site-hero-heading max-w-[30.5rem]">
            Do you want to know God&apos;s Purpose for your Life?
          </h1>
          <Link
            href="#pathways"
            className="site-button-text mt-0.5 inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-white"
          >
            Start Here
          </Link>
        </div>
      </section>

      <section id="pathways" className="bg-white px-2 pb-[5rem] pt-5 sm:px-5">
        <div className="grid grid-cols-2 gap-2 sm:gap-5">
          {homePathwayCards.map((card) => (
            <HomepagePathwayCard key={card.title} {...card} />
          ))}
        </div>
      </section>
    </>
  );
}
