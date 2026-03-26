import Image from "next/image";
import Link from "next/link";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import {
  type QuestionsPathwaySeriesItem,
  questionsPathwayHero,
  questionsPathwaySeries,
} from "../../lib/questions-pathway-content";

function QuestionsSeriesCard({
  title,
  description,
  thumbnailSrc,
  playIconSrc,
  href,
}: QuestionsPathwaySeriesItem) {
  return (
    <Link
      href={href}
      className="group grid gap-4"
      aria-label={`Open ${title}`}
    >
      <div className="relative aspect-[256/263] overflow-hidden rounded-[11px] bg-[#d98d54] shadow-[var(--shadow-sm)]">
        <Image
          src={thumbnailSrc}
          alt=""
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.015]"
          sizes="(max-width: 419px) calc(100vw - 3.25rem), (max-width: 1279px) 16rem, 20rem"
        />
        <div className="absolute inset-0 bg-black/12 transition-colors duration-200 group-hover:bg-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/12 p-1 backdrop-blur-[1px]">
            <Image
              src={playIconSrc}
              alt=""
              width={84}
              height={84}
              className="h-[5rem] w-[5rem] transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-left">
        <h2 className="font-[var(--font-sen)] text-[1.275rem] font-semibold leading-[1] tracking-[-0.028em] text-[var(--color-brand-indigo)]">
          {title}
        </h2>
        <p className="max-w-[17rem] text-[0.75rem] leading-[1.2] tracking-[-0.02em] text-[var(--color-text-muted)] md:max-w-none md:text-[0.875rem]">
          {description}
        </p>
      </div>
    </Link>
  );
}

export function QuestionsPathwayView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="relative overflow-hidden bg-[var(--color-brand-lime)]">
          <div className="relative flex min-h-[17.8125rem] flex-col justify-end px-[1.6875rem] pb-[2.125rem] pt-10 md:min-h-[22rem] md:px-8 md:pb-[2.625rem] md:pt-12 xl:min-h-[25rem] xl:px-10 xl:pb-[3rem] xl:pt-14">
            <div className="relative z-10 grid max-w-[18rem] gap-3 md:max-w-[20rem] md:gap-4 xl:max-w-[28rem]">
              <h1 className="site-hero-heading max-w-[12rem] text-[2.8rem] text-[var(--color-brand-indigo)] md:max-w-[15rem] md:text-[3.6rem] xl:max-w-[17rem] xl:text-[4.15rem]">
                {questionsPathwayHero.title}
              </h1>
              <p className="max-w-[16.75rem] text-[1.0625rem] leading-[1.1] tracking-[-0.025em] text-[var(--color-brand-indigo)] md:max-w-[18rem] md:text-[1.2rem] xl:max-w-[21rem] xl:text-[1.35rem]">
                {questionsPathwayHero.description}
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-[-0.5rem] right-[-1.5rem] h-[13rem] w-[11.25rem] md:bottom-[-1.5rem] md:right-[-1.75rem] md:h-[17rem] md:w-[14rem] xl:bottom-[-2rem] xl:right-[-2rem] xl:h-[21rem] xl:w-[17rem]">
              <Image
                src={questionsPathwayHero.illustrationSrc}
                alt=""
                fill
                className="object-contain object-right-bottom"
                sizes="(max-width: 767px) 11.25rem, (max-width: 1279px) 14rem, 17rem"
                priority
              />
            </div>
          </div>
        </section>

        <section className="bg-white px-[1.5625rem] pb-[6.25rem] pt-12 md:px-8 md:pb-20 md:pt-14 xl:px-10">
          <div className="mx-auto max-w-[61rem]">
            <div className="grid gap-x-[1.1875rem] gap-y-10 min-[420px]:grid-cols-2 md:gap-x-6 md:gap-y-12 xl:grid-cols-3 xl:gap-x-8">
              {questionsPathwaySeries.map((series) => (
                <QuestionsSeriesCard key={series.title} {...series} />
              ))}
            </div>
          </div>
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
