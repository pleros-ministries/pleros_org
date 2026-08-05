import { HomepageCarousel } from "./homepage-carousel";
import { HomepagePathwayCard } from "./homepage-pathway-card";
import { homeCarouselSlides, homePathwayCards } from "../../lib/site-homepage-content";

export function HomepageHero() {
  return (
    <section id="pathways" className="bg-white px-2 pt-8 sm:px-5 sm:pt-10 lg:px-16 lg:pt-8 lg:pb-16">
      <div className="grid justify-items-center gap-2 px-4 pb-8 text-center sm:pb-9 lg:gap-3 lg:pb-8">
        <p className="site-hero-eyebrow">
          Pleros ministries &amp; missions
        </p>

        {/* <h1 className=" py-2 site-hero-heading max-w-[30.5rem] lg:max-w-[44rem] lg:text-[clamp(2.5rem,5vw,3.75rem)]">
          Pleros ministries &amp; missions
        </h1> */}
      </div>

      <div className="pb-8 sm:pb-9 lg:pb-8">
        <HomepageCarousel slides={homeCarouselSlides} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-5 pb-12 sm:mt-0 sm:gap-x-5 sm:gap-y-5 sm:pb-12 md:grid-cols-4 lg:pb-0">
        {homePathwayCards.map((card) => (
          <HomepagePathwayCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}
