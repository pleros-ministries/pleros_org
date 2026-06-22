import { cookies } from "next/headers";

import { readWelcomeAccessToken, WELCOME_ACCESS_COOKIE_NAME } from "@/lib/welcome-access";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageGiftDrawer } from "./homepage-gift-drawer";
import { HomepageHero } from "./homepage-hero";
import { HomepageNav } from "./homepage-nav";
import { HomepagePodcastSection } from "./homepage-podcast-section";
import { HomepageSocialSection } from "./homepage-social-section";
import { getLatestYoutubeEpisode, getLatestYoutubeVideos } from "../../lib/homepage-feed";
import type { HomeInstagramReel } from "../../lib/site-homepage-content";

export async function HomepageView() {
  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );

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
        <HomepageGiftDrawer hasWelcomeAccess={Boolean(welcomeAccess)} />
        <HomepageNav />
        <HomepageHero />
        <HomepageCommunitySection />
        <HomepagePodcastSection episode={episode} />
        <HomepageSocialSection posts={posts} />
        {/* <HomepageLibrarySection /> */}
        <HomepageFooter />
      </div>
    </div>
  );
}
