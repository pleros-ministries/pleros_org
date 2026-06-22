import { HomepagePathwayCard } from "./homepage-pathway-card";
import { homePathwayCards } from "../../lib/site-homepage-content";

export function HomepageHero() {
  return (
    <section id="pathways" className="bg-white px-2 pb-10 pt-3 sm:px-5 lg:px-16 lg:pt-8 lg:pb-16">
      <div className="grid justify-items-center gap-2 px-4 pb-5 text-center sm:pb-6 lg:gap-3 lg:pb-8">
        <p className="site-hero-eyebrow">
          Pleros ministries &amp; missions
        </p>
        <h1 className="site-hero-heading max-w-[30.5rem] lg:max-w-[44rem] lg:text-[clamp(2.5rem,5vw,3.75rem)]">
          Want to find out God&apos;s Purpose for your Life?
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-5 md:grid-cols-4">
        {homePathwayCards.map((card) => (
          <HomepagePathwayCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
