import { cookies } from "next/headers";

import { readWelcomeAccessToken, WELCOME_ACCESS_COOKIE_NAME } from "@/lib/welcome-access";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageGiftDrawer } from "./homepage-gift-drawer";
import { HomepageHero } from "./homepage-hero";
import { HomepageNav } from "./homepage-nav";
import { HomepagePodcastSection } from "./homepage-podcast-section";
import { HomepageSocialSection } from "./homepage-social-section";
import { getLatestYoutubeEpisode } from "../../lib/homepage-feed";
import { homeInstagramReels } from "../../lib/site-homepage-content";

export async function HomepageView() {
  const cookieStore = await cookies();
  const welcomeAccess = readWelcomeAccessToken(
    cookieStore.get(WELCOME_ACCESS_COOKIE_NAME)?.value,
    process.env,
  );
  const episode = await getLatestYoutubeEpisode();

  return (
    <div className="bg-[#f3f7fb] px-0 md:px-6 md:py-6">
      <div className="mx-auto w-full max-w-[36.1875rem] overflow-hidden bg-[var(--color-bg)]">
        <HomepageGiftDrawer hasWelcomeAccess={Boolean(welcomeAccess)} />
        <HomepageNav />
        <HomepageHero />
        <HomepagePodcastSection episode={episode} />
        <HomepageSocialSection posts={homeInstagramReels} />
        {/* <HomepageLibrarySection /> */}
        <HomepageCommunitySection />
        <HomepageFooter />
      </div>
    </div>
  );
}
