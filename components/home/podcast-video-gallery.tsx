"use client";

import Image from "next/image";
import { PlayIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

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
  series: readonly PodcastPlayableItem[];
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

export function PodcastVideoGallery({
  featured,
  series,
}: PodcastVideoGalleryProps) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const videos = useMemo(
    () => (featured ? [featured, ...series] : series),
    [featured, series],
  );

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId, videos],
  );

  function selectVideo(id: string) {
    setIsPlayerReady(false);
    setSelectedVideoId((current) => (current === id ? null : id));
  }

  return (
    <div className="grid gap-8">
      {featured ? (
        <div className="grid gap-4">
          <div className="grid overflow-hidden rounded-[1.25rem] bg-[var(--color-brand-blue)] md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="relative min-h-[14rem] overflow-hidden bg-[var(--color-brand-blue)] md:min-h-full">
              {selectedVideo?.id === featured.id ? (
                <div className="relative aspect-video h-full min-h-[14rem] w-full">
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
                    className="object-cover object-top"
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
                  onClick={() => selectVideo(featured.id)}
                  aria-label={`${selectedVideo?.id === featured.id ? "Hide player for" : "Play"} ${featured.title}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                >
                  {selectedVideo?.id === featured.id ? (
                    <XIcon className="size-4.5 stroke-[2.2]" />
                  ) : (
                    <PlayIcon className="size-4.5 fill-current stroke-current" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {series.length ? (
        <div className="grid gap-3">
        <div className="grid gap-2">
          <p className="site-hero-eyebrow">Series</p>
          <h3 className="site-section-heading max-w-[28rem]">
            Start each teaching journey from the beginning
          </h3>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border-[var(--color-line)] bg-white">
          <div className="divide-y divide-[rgba(6,16,86,0.12)]">
            {series.map((item) => {
              const isActive = selectedVideo?.id === item.id;

              return (
                <div key={item.id} className="px-5 py-5 md:px-6 md:py-6">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 md:gap-6">
                    <div className="grid gap-2 text-left">
                      <h3 className="font-[var(--font-sen)] text-[1.45rem] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-brand-indigo)] md:text-[1.6rem]">
                        {item.title}
                      </h3>
                      {item.description ? (
                        <p className="max-w-[36rem] font-[var(--font-sans)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)] md:text-[1rem]">
                          {item.description}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => selectVideo(item.id)}
                      aria-label={`${isActive ? "Hide player for" : "Play"} ${item.title}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                    >
                      {isActive ? (
                        <XIcon className="size-4 stroke-[2.2]" />
                      ) : (
                        <PlayIcon className="size-4 fill-current stroke-current" />
                      )}
                    </button>
                  </div>

                  {isActive ? (
                    <div className="mt-5 overflow-hidden rounded-[var(--radius-md)] border border-[rgba(6,16,86,0.12)] bg-[var(--color-surface-muted)] p-2 md:p-3">
                      <div className="relative aspect-video w-full overflow-hidden rounded-[calc(var(--radius-md)-0.25rem)] bg-black">
                        <iframe
                          src={toYoutubeEmbedUrl(item.href)}
                          title={item.title}
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
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      ) : null}
    </div>
  );
}
