import Image from "next/image";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PurposeVideoGallery } from "./purpose-video-gallery";
import {
  purposePathwayHero,
  purposePathwayVideos,
} from "../../lib/purpose-pathway-content";

export function PurposePathwayView() {
  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)] md:max-w-[48rem] xl:max-w-[67rem]">
        <HomepageNav />

        <section className="relative overflow-hidden bg-[#68369b]">
          <div className="relative flex min-h-[17.8125rem] flex-col justify-end px-[1.25rem] pb-[2.125rem] pt-10 md:min-h-[22rem] md:px-6 md:pb-[2.625rem] md:pt-12 xl:min-h-[25rem] xl:px-8 xl:pb-[3rem] xl:pt-14">
            <div className="relative z-10 grid max-w-[18rem] gap-2.5 md:max-w-[21rem] md:gap-4 xl:max-w-[28rem]">
              <h1 className="site-hero-heading max-w-[15rem] text-[2.8rem] text-white md:max-w-[17rem] md:text-[3.6rem] xl:max-w-[19rem] xl:text-[4.15rem]">
                {purposePathwayHero.title}
              </h1>
              <p className="max-w-[16.75rem] text-[1.0625rem] leading-[1.1] tracking-[-0.025em] text-white md:max-w-[18rem] md:text-[1.2rem] xl:max-w-[21rem] xl:text-[1.35rem]">
                {purposePathwayHero.description}
              </p>
            </div>

            <div className="pointer-events-none absolute bottom-[-0.9rem] right-[-2.15rem] h-[11rem] w-[13.875rem] md:bottom-[-1.35rem] md:right-[-2.4rem] md:h-[13.75rem] md:w-[17.25rem] xl:bottom-[-1.65rem] xl:right-[-2.8rem] xl:h-[16rem] xl:w-[20rem]">
              <Image
                src={purposePathwayHero.illustrationSrc}
                alt=""
                fill
                className="object-contain object-right-bottom"
                sizes="(max-width: 767px) 13.875rem, (max-width: 1279px) 17.25rem, 20rem"
                priority
              />
            </div>
          </div>
        </section>

        <section className="bg-white px-[1.5rem] pb-[6.25rem] pt-[3.125rem] md:px-6 md:pb-20 md:pt-12 xl:px-8">
          <PurposeVideoGallery videos={purposePathwayVideos} />
        </section>

        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
