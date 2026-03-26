import Image from "next/image";
import Link from "next/link";

import type { YoutubeEpisode } from "../../lib/homepage-feed";
import { homePodcastUrl } from "../../lib/site-homepage-content";

type HomepagePodcastSectionProps = {
  episode: YoutubeEpisode | null;
};

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

export function HomepagePodcastSection({
  episode,
}: HomepagePodcastSectionProps) {
  return (
    <section
      id="podcast"
      className="bg-[var(--color-brand-sky-soft)] px-[1.625rem] pb-16 pt-10"
    >
      <div className="grid gap-6">
        <div className="grid justify-items-center gap-[0.62rem] text-center">
          <h2 className="site-section-heading max-w-[30.9375rem]">
            Stay Full of God&apos;s Word with the Pleros Podcast
          </h2>
          <p className="max-w-[24.1875rem] text-[1.125rem] leading-[1.3] tracking-[-0.02em] text-[var(--color-text)]">
            Your 15 minute dose of truth helping you fulfil God&apos;s Purpose.
            Available wherever you get your podcasts.
          </p>
          <Link
            href={homePodcastUrl}
            target="_blank"
            rel="noreferrer"
            className="site-button-text mt-1 inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-white"
          >
            Listen Now
          </Link>
        </div>

        {episode ? (
          <a
            href={episode.href}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <div className="grid overflow-hidden rounded-[11px] bg-[var(--color-brand-blue)]">
              <div className="overflow-hidden">
                <Image
                  src={episode.thumbnailUrl}
                  alt={episode.title}
                  width={528}
                  height={297}
                  className="h-auto w-full object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 528px"
                />
              </div>

              <div className="grid min-h-[11.5rem] content-between bg-[var(--color-brand-blue)] px-[1.625rem] pb-7 pt-[1.4rem] text-white">
                <div className="grid gap-[0.72rem]">
                  <p className="site-podcast-card-label">
                    Latest episode
                  </p>
                  <div className="grid gap-[0.45rem]">
                    <h3 className="site-podcast-card-title max-w-[24rem]">
                      {episode.title}
                    </h3>
                    <p className="site-podcast-card-date">
                      {formatEpisodeDate(episode.publishedAt)}
                    </p>
                  </div>
                </div>

                <span className="site-button-text mt-5 inline-flex w-fit min-h-[2.5rem] items-center justify-center rounded-full bg-white px-6 py-2 text-[0.8125rem] leading-none font-semibold text-[var(--color-brand-blue)]">
                  Play Now
                </span>
              </div>
            </div>
          </a>
        ) : (
          <div className="rounded-[11px] bg-[var(--color-brand-blue)] px-6 py-8 text-white">
            <div className="grid gap-6">
              <div className="grid gap-[0.72rem]">
                <p className="site-podcast-card-label">
                  Latest episode
                </p>
                <h3 className="site-podcast-card-title max-w-[24rem]">
                  Open the Pleros Media channel to listen to the latest upload
                </h3>
              </div>

              <Link
                href={homePodcastUrl}
                target="_blank"
                rel="noreferrer"
                className="site-button-text mt-5 inline-flex w-fit min-h-[2.5rem] items-center justify-center rounded-full bg-white px-6 py-2 text-[0.8125rem] leading-none font-semibold text-[var(--color-brand-blue)]"
              >
                Open channel
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
