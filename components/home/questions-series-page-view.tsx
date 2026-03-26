import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { QuestionsSeriesVideoGallery } from "./questions-series-video-gallery";
import type { QuestionsSeriesPage } from "../../lib/questions-pathway-content";

export function QuestionsSeriesPageView({
  series,
}: {
  series: QuestionsSeriesPage;
}) {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="bg-[var(--color-brand-lime)] px-[1.25rem] pb-[1.375rem] pt-[5.25rem] md:px-6 md:pb-8 md:pt-20 xl:px-8 xl:pb-10">
          <div className="max-w-[21rem] md:max-w-[32rem]">
            <h1 className="site-hero-heading text-[2.6rem] text-[var(--color-brand-indigo)] md:text-[3.35rem] xl:text-[4rem]">
              {series.title}
            </h1>
            <p className="mt-3 max-w-[18rem] text-[1.05rem] leading-[1.04] tracking-[-0.024em] text-[var(--color-brand-indigo)] md:max-w-[21rem] md:text-[1.2rem]">
              {series.description}
            </p>
          </div>
        </section>

        <section className="bg-white px-[1.5rem] pb-[6.25rem] pt-[2.375rem] md:px-6 md:pb-20 md:pt-12 xl:px-8">
          <QuestionsSeriesVideoGallery series={series} />
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
