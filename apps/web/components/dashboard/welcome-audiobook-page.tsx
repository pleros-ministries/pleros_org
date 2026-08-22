import Link from "next/link";

import { HomepageCommunitySection } from "@/components/home/homepage-community-section";
import { WelcomeAudiobookPlayerBar } from "@/components/dashboard/welcome-audiobook-player-bar";
import { WelcomeAudiobookPlayerProvider } from "@/components/dashboard/welcome-audiobook-player-context";
import { WelcomeAudiobookTrackList } from "@/components/dashboard/welcome-audiobook-track-list";
import { welcomeAudiobookTracks } from "@/lib/welcome-audiobook";

export function WelcomeAudiobookPage() {
  return (
    <WelcomeAudiobookPlayerProvider tracks={welcomeAudiobookTracks}>
      <section className="site-font-theme bg-[var(--color-surface)] pt-5 sm:pt-6">
        <div className="container-pleros grid max-w-[36rem] gap-6 pb-24 sm:pb-28">
          <Link
            href="/dashboard/welcomepack"
            className="site-button-text w-fit text-[0.75rem] font-semibold text-[var(--color-brand-blue)] hover:underline"
          >
            ← Back to Welcome Pack
          </Link>

          <div className="grid gap-2">
            <h1 className="site-hero-heading text-[clamp(2.1rem,5.6vw,3rem)] text-[var(--color-brand-blue)]">
              Welcome to Purpose (Audiobook)
            </h1>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.9rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
              Listen to the book in audio format. Play a chapter, download it
              for offline listening, or share a link back to this page.
            </p>
          </div>

          <WelcomeAudiobookTrackList />
        </div>

        <HomepageCommunitySection />
      </section>

      <WelcomeAudiobookPlayerBar />
    </WelcomeAudiobookPlayerProvider>
  );
}
