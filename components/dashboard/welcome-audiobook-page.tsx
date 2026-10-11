import { DashboardPageFrame, DashboardPageHeader, DashboardSection, EyebrowLink } from "./shared/page";

import { HomepageCommunitySection } from "@/components/home/homepage-community-section";
import { WelcomeAudiobookPlayerBar } from "@/components/dashboard/welcome-audiobook-player-bar";
import { WelcomeAudiobookPlayerProvider } from "@/components/dashboard/welcome-audiobook-player-context";
import { WelcomeAudiobookTrackList } from "@/components/dashboard/welcome-audiobook-track-list";
import { welcomeAudiobookTracks } from "@/lib/welcome-audiobook";

export function WelcomeAudiobookPage({ hubHref = "/dashboard/welcomepack", embedded = false }: { hubHref?: string; embedded?: boolean }) {
  const content = <div className="grid max-w-[40rem] gap-6 pb-24">
    <DashboardPageHeader eyebrow={<EyebrowLink href={hubHref}>Welcome Pack</EyebrowLink>} title="Audiobook" description="Welcome to Purpose" />
    <DashboardSection title="Chapters"><WelcomeAudiobookTrackList /></DashboardSection>
  </div>;
  return <WelcomeAudiobookPlayerProvider tracks={welcomeAudiobookTracks}>
    {embedded ? content : <DashboardPageFrame>{content}</DashboardPageFrame>}
    {embedded ? null : <HomepageCommunitySection />}
    <WelcomeAudiobookPlayerBar />
  </WelcomeAudiobookPlayerProvider>;
}
