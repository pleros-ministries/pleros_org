import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import { getLatestYoutubeEpisode } from "@/lib/homepage-feed";
import {
  podcastFeaturedSection,
  podcastJourneySteps,
  podcastPageHero,
  podcastSeries,
  podcastSubscribeCta,
  podcastWhyListenItems,
} from "@/lib/podcast-page-content";

import { HomepageCommunitySection } from "./homepage-community-section";
import { HomepageFooter } from "./homepage-footer";
import { HomepageNav } from "./homepage-nav";
import { PodcastRssList } from "./podcast-rss-list";
import { PodcastVideoGallery } from "./podcast-video-gallery";
import { PublicSitePageShell } from "./public-site-page-shell";

function formatEpisodeDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Latest episode";
  }
}

export async function PodcastPageView() {
  const [episode, rssEpisodes] = await Promise.all([
    getLatestYoutubeEpisode(),
    fetchAnchorEpisodes(),
  ]);
  const featuredVideo = episode
    ? {
      id: episode.id,
      title: episode.title,
      href: episode.href,
      thumbnailSrc: episode.thumbnailUrl,
      dateLabel: formatEpisodeDate(episode.publishedAt),
    }
    : null;

  return (
    <PublicSitePageShell>
      <HomepageNav />

      <section className="relative overflow-hidden bg-[var(--color-brand-sky-soft)]">
        <div className="relative flex min-h-[17.8125rem] flex-col justify-end px-[1.25rem] pb-[2.125rem] pt-10 md:min-h-[22rem] md:px-8 md:pb-[2.625rem] md:pt-12 xl:min-h-[25rem] xl:px-10 xl:pb-[3rem] xl:pt-14">
          <div className="relative z-10 grid max-w-[18rem] gap-3 md:max-w-[20rem] md:gap-4 xl:max-w-[24rem]">
            <p className="site-hero-eyebrow">{podcastPageHero.eyebrow}</p>
            <h1 className="site-hero-heading text-[var(--color-brand-indigo)] md:max-w-[16rem] md:text-[3.6rem] md:leading-none xl:max-w-[19rem] xl:text-[4.15rem]">
              <span className="grid gap-0 md:hidden">
                <span className="whitespace-nowrap text-[clamp(1.9rem,6.8vw,2.15rem)] leading-[0.98] tracking-[-0.05em]">
                  {podcastPageHero.mobileTitleLines[0]}
                </span>
                <span className="whitespace-nowrap text-[clamp(1.9rem,6.8vw,2.15rem)] leading-[0.98] tracking-[-0.05em]">
                  {podcastPageHero.mobileTitleLines[1]}
                </span>
              </span>
              <span className="hidden md:inline">{podcastPageHero.title}</span>
            </h1>
          </div>
        </div>
      </section>

      <section className="bg-white px-[1.25rem] pb-[4.75rem] pt-[2.5rem] md:px-8 md:pb-16 md:pt-10 xl:px-10">
        <div className="mx-auto grid max-w-[58rem] gap-8">
          <div className="grid gap-2">
            <p className="site-hero-eyebrow">{podcastFeaturedSection.eyebrow}</p>
            <h2 className="site-section-heading max-w-[25rem]">
              {podcastFeaturedSection.title}
            </h2>
          </div>

          {episode ? null : (
            <Card className="gap-5 rounded-[1.25rem] border-[rgba(6,16,86,0.12)] bg-[linear-gradient(180deg,#f4f9ff_0%,#dff3ff_100%)] p-6 shadow-[0_16px_38px_rgba(6,16,86,0.08)] md:p-7">
              <CardHeader className="gap-2 px-0 py-0">
                <Badge variant="outline" className="w-fit border-[rgba(6,16,86,0.12)]">
                  Latest teaching
                </Badge>
                <CardTitle className="site-section-heading text-[1.9rem] md:text-[2.2rem]">
                  {podcastFeaturedSection.fallbackTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="gap-5 px-0 pb-0">
                <div className="flex">
                  <Button
                    size="lg"
                    render={
                      <Link
                        href={podcastSubscribeCta.href}
                        target="_blank"
                        rel="noreferrer"
                        className="site-button-text"
                      />
                    }
                    className="min-h-[2.875rem] rounded-full px-6 text-[0.875rem] font-semibold"
                  >
                    {podcastFeaturedSection.fallbackCtaLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <PodcastVideoGallery featured={featuredVideo} series={[]} />

          <div className="flex justify-center md:justify-start">
            <Button
              size="lg"
              render={
                <Link
                  href={podcastSubscribeCta.href}
                  target="_blank"
                  rel="noreferrer"
                  className="site-button-text"
                />
              }
              className="min-h-[2.875rem] rounded-full px-6 text-[0.875rem] font-semibold"
            >
              {podcastSubscribeCta.label}
            </Button>
          </div>

          <PodcastVideoGallery featured={null} series={podcastSeries} />
        </div>
      </section>

      {/* All episodes from Anchor RSS — public, no auth required */}
      <section className="bg-[var(--color-surface-muted)] px-[1.25rem] pb-[4.75rem] pt-[2.5rem] md:px-8 md:pb-16 md:pt-10 xl:px-10">
        <div className="mx-auto grid max-w-[58rem] gap-6">
          <div className="grid gap-2">
            <p className="site-hero-eyebrow">All episodes</p>
            <h2 className="site-section-heading max-w-[28rem]">
              Listen and download every episode
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.93rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)]">
              Stream directly here, download as an MP3, or open on Spotify.
            </p>
          </div>

          <PodcastRssList episodes={rssEpisodes} />
        </div>
      </section>

      {/* <section className="bg-[var(--color-surface-muted)] px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10">
          <div className="mx-auto grid max-w-[58rem] gap-8">
            <div className="grid gap-2 text-center">
              <p className="site-hero-eyebrow justify-center">Why listen</p>
              <h2 className="site-section-heading">Why this podcast helps</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {podcastWhyListenItems.map((item) => (
                <Card
                  key={item.title}
                  className="gap-4 rounded-[1.25rem] border-[rgba(6,16,86,0.1)] bg-white p-5 shadow-[0_12px_30px_rgba(6,16,86,0.06)]"
                >
                  <CardHeader className="gap-2 px-0 py-0">
                    <CardTitle className="font-[var(--font-sen)] text-[1.45rem] font-bold leading-[1] tracking-[-0.045em] text-[var(--color-brand-indigo)]">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardDescription className="text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)]">
                    {item.description}
                  </CardDescription>
                </Card>
              ))}
            </div>
          </div>
        </section> */}

      <section
        id="journey"
        className="bg-white px-[1.25rem] py-[4.25rem] md:px-8 md:py-16 xl:px-10"
      >
        <div className="mx-auto grid max-w-[58rem] gap-8">
          <div className="grid gap-2 text-center">
            <p className="site-hero-eyebrow justify-center">Next steps</p>
            <h2 className="site-section-heading">
              Let the Podcast lead you deeper into the Pleros journey
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {podcastJourneySteps.map((step) => (
              <Card
                key={step.title}
                tone={step.tone}
                className="gap-3 rounded-[1.25rem] border-0 p-5 shadow-[0_14px_32px_rgba(15,23,40,0.06)]"
              >
                <CardHeader className="gap-3 px-0 py-0">
                  <p className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--color-brand-indigo)]">
                    {step.eyebrow}
                  </p>
                  <CardTitle className="font-[var(--font-sen)] text-[1.5rem] font-bold leading-[1] tracking-[-0.045em] text-[var(--color-text-strong)]">
                    {step.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="gap-5 px-0 pb-0">
                  <p className="text-[0.98rem] leading-[1.5] tracking-[-0.02em] text-[var(--color-text-muted)]">
                    {step.description}
                  </p>

                  <div className="flex">
                    <Button
                      size="lg"
                      variant="secondary"
                      render={<Link href={step.href} className="site-button-text" />}
                      className="min-h-[2.75rem] rounded-full border-0 px-5 text-[0.8125rem] font-semibold"
                    >
                      {step.ctaLabel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <HomepageCommunitySection />
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
