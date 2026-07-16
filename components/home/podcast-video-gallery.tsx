"use client";

import Image from "next/image";
import { PlayIcon, XIcon } from "lucide-react";
import { useState } from "react";

export type PodcastPlayableItem = {
  id: string;
  title: string;
  href: string;
  description?: string;
  thumbnailSrc?: string;
  dateLabel?: string;
};

type PodcastVideoGalleryProps = {
  featured: PodcastPlayableItem | null;
};

function toYoutubeEmbedUrl(href: string) {
  try {
    const url = new URL(href);
    const videoId = url.searchParams.get("v");

    if (!videoId) {
      return href;
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  } catch {
    return href;
  }
}

export function PodcastVideoGallery({ featured }: PodcastVideoGalleryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  if (!featured) {
    return null;
  }

  function selectVideo() {
    setIsPlayerReady(false);
    setIsPlaying((current) => !current);
  }

  return (
    <div className="grid gap-4">
      <div className="grid overflow-hidden rounded-[1.25rem] bg-[var(--color-brand-blue)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] md:items-center">
        <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-brand-blue)]">
          {isPlaying ? (
            <div className="relative aspect-video w-full">
              <iframe
                src={toYoutubeEmbedUrl(featured.href)}
                title={featured.title}
                className={`h-full w-full border-0 transition-opacity duration-200 ${
                  isPlayerReady ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                onLoad={() => setIsPlayerReady(true)}
              />

              {!isPlayerReady ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[rgba(5,20,128,0.18)] text-white">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <p className="text-[0.8125rem] font-medium tracking-[-0.02em] text-white">
                    Loading player...
                  </p>
                </div>
              ) : null}
            </div>
          ) : featured.thumbnailSrc ? (
            <>
              <Image
                src={featured.thumbnailSrc}
                alt=""
                fill
                className="scale-[1.28] object-cover object-center"
                sizes="(max-width: 767px) 100vw, 29rem"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,128,0.08)_0%,rgba(5,20,128,0.22)_100%)]" />
            </>
          ) : null}
        </div>

        <div className="grid content-between gap-6 px-5 py-6 text-white md:px-7 md:py-7">
          <div className="grid gap-3">
            <p className="site-podcast-card-label">Latest episode</p>
            <div className="grid gap-2">
              <h3 className="site-podcast-card-title max-w-[20rem]">
                {featured.title}
              </h3>
              <p className="site-podcast-card-date">
                {featured.dateLabel ?? "Latest episode"}
              </p>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={selectVideo}
              aria-label={`${isPlaying ? "Hide player for" : "Play"} ${featured.title}`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
            >
              {isPlaying ? (
                <XIcon className="size-4.5 stroke-[2.2]" />
              ) : (
                <PlayIcon className="size-4.5 fill-current stroke-current" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
