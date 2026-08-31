import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageHero } from "./homepage-hero";
import { HomepageNav } from "./homepage-nav";
import { HomepagePodcastSection } from "./homepage-podcast-section";
import { HomepagePrayerWatchSection } from "./homepage-prayer-watch-section";
import { HomepageSogpDrawer } from "./homepage-sogp-drawer";
import { HomepageSocialSection } from "./homepage-social-section";
import { getLatestYoutubeEpisode, getLatestYoutubeVideos } from "../../lib/homepage-feed";
import type { HomeInstagramReel } from "../../lib/site-homepage-content";

export async function HomepageView() {
  const [episode, youtubeVideos] = await Promise.all([
    getLatestYoutubeEpisode(),
    getLatestYoutubeVideos(5),
  ]);

  const posts: HomeInstagramReel[] = youtubeVideos.map((v) => ({
    id: v.id,
    title: v.title,
    href: v.href,
    imageUrl: v.thumbnailUrl,
    profileImageUrl: null,
    takenAt: Math.floor(new Date(v.publishedAt).getTime() / 1000),
  }));

  return (
    <div className="bg-[#f3f7fb] px-0 md:px-0  md:py-0">
      <div className="mx-auto w-full max-w-none bg-[var(--color-bg)]">
        <HomepageSogpDrawer
          headline="Want to grow and fulfil God&apos;s purpose for your life?"
          question="Have questions on difficult matters about God and the Christian faith?"
          body="Learn, ask questions and grow to fulfil God&apos;s purpose."
          ctaLabel="Enrol for SOGP"
          ctaHref="/sogp/enrol"
        />
        <HomepageNav />
        <HomepageHero />
        <HomepageCommunitySection />
        <HomepagePodcastSection episode={episode} />
        <HomepagePrayerWatchSection />
        <HomepageSocialSection posts={posts} />
        {/* <HomepageLibrarySection /> */}
        <HomepageFooter />
      </div>
    </div>
  );
}
