"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3Icon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  QuestionsPathwayVideoItem,
  QuestionsSeriesPage,
} from "@/lib/questions-pathway-content";

function isDirectVideoHref(href: string): boolean {
  return href.includes(".ufs.sh/f/") || href.match(/\.(mp4|webm|ogg)(\?|$)/i) !== null;
}

function QuestionsSeriesComingSoon({ series }: { series: QuestionsSeriesPage }) {
  return (
    <div className="mx-auto w-full max-w-[40rem]">
      <div className="relative overflow-hidden rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-brand-sky-soft)] shadow-[var(--shadow-sm)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <Image
            src={series.thumbnailSrc}
            alt=""
            fill
            className="object-cover"
            sizes="40rem"
          />
        </div>

        <div className="relative grid gap-5 px-6 py-10 text-center md:px-10 md:py-12">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-white/75 text-[var(--color-brand-indigo)] shadow-[inset_0_0_0_1px_rgba(1,21,133,0.08)]">
            <Clock3Icon className="size-5" aria-hidden />
          </div>

          <div className="grid gap-2">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-indigo)]">
              Coming soon
            </p>
            <h2 className="font-[var(--font-sen)] text-[1.55rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--color-brand-indigo)] md:text-[1.85rem]">
              Teachings are on the way
            </h2>
            <p className="mx-auto max-w-[24rem] text-[0.9375rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-strong)] md:text-[1rem]">
              {series.comingSoonMessage ??
                "This series is being prepared and will be available here soon."}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:justify-center">
            <Button
              size="lg"
              render={
                <Link
                  href="/questions/gospel-answers-simple-series"
                  className="site-button-text"
                />
              }
              className="min-h-[2.75rem] rounded-full px-6 text-[0.8125rem] font-semibold uppercase tracking-[0.02em]"
            >
              Watch simple version
            </Button>
            <Button
              size="lg"
              variant="secondary"
              render={<Link href="/questions" className="site-button-text" />}
              className="min-h-[2.75rem] rounded-full px-6 text-[0.8125rem] font-semibold uppercase tracking-[0.02em]"
            >
              All question series
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsVideoCard({
  title,
  description: _description,
  thumbnailSrc,
  playIconSrc,
  onPlay,
}: QuestionsPathwayVideoItem & {
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group grid gap-3.5 text-left"
      aria-label={`Play ${title}`}
    >
      <div className="relative aspect-[395/214] overflow-hidden rounded-[0.875rem] bg-[#d98d54] shadow-[var(--shadow-sm)]">
        <Image
          src={thumbnailSrc}
          alt=""
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.015]"
          sizes="(max-width: 767px) calc(100vw - 4.25rem), (max-width: 1279px) 38rem, 42rem"
        />
        <div className="absolute inset-0 bg-black/12 transition-colors duration-200 group-hover:bg-black/18" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-white/12 p-1 backdrop-blur-[1px]">
            <Image
              src={playIconSrc}
              alt=""
              width={84}
              height={84}
              className="h-[4.75rem] w-[4.75rem] transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-1.5 text-left">
        <h2 className="font-[var(--font-sen)] text-[1.125rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--color-brand-indigo)] md:text-[1.4rem]">
          {title}
        </h2>
        {/* Subtitle hidden for now — restore when copy is finalized.
        <p className="max-w-[18rem] text-[0.75rem] leading-[1.18] tracking-[-0.02em] text-[var(--color-text-muted)] md:max-w-[22rem] md:text-[0.875rem]">
          {_description}
        </p>
        */}
      </div>
    </button>
  );
}

export function QuestionsSeriesVideoGallery({
  series,
}: {
  series: QuestionsSeriesPage;
}) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const selectedVideo = useMemo(
    () => series.videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId, series.videos],
  );
  const selectedVideoUsesDirectPlayback = selectedVideo
    ? isDirectVideoHref(selectedVideo.href)
    : false;

  if (series.comingSoon) {
    return <QuestionsSeriesComingSoon series={series} />;
  }

  return (
    <>
      <div className="mx-auto grid max-w-[49rem] gap-9 md:gap-10">
        {series.videos.map((video) => (
          <QuestionsVideoCard
            key={video.id}
            {...video}
            onPlay={() => {
              setIsPlayerReady(false);
              setSelectedVideoId(video.id);
            }}
          />
        ))}
      </div>

      <Dialog
        open={Boolean(selectedVideo)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setIsPlayerReady(false);
            setSelectedVideoId(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="site-font-theme w-[min(100%-1rem,42rem)] gap-3 rounded-[var(--radius-xl)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 sm:p-4"
        >
          <DialogHeader className="gap-0 border-none pb-0 pr-0">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="font-[var(--font-sen)] text-[1.15rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--color-brand-indigo)] sm:text-[1.35rem]">
                {selectedVideo?.title ?? ""}
              </DialogTitle>

              <DialogClose
                render={
                  <button
                    type="button"
                    aria-label="Close video player"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors duration-150 hover:text-[var(--color-text-strong)]"
                  />
                }
              >
                <XIcon className="size-4.5 stroke-[2.2]" />
              </DialogClose>
            </div>
          </DialogHeader>

          {selectedVideo ? (
            <div className="grid gap-3">
              <div className="overflow-hidden rounded-[var(--radius-md)] bg-black shadow-[var(--shadow-sm)]">
                <div className="relative aspect-video w-full">
                  {selectedVideoUsesDirectPlayback ? (
                    <video
                      src={selectedVideo.href}
                      title={selectedVideo.title}
                      className={`h-full w-full transition-opacity duration-200 ${
                        isPlayerReady ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      onLoadedData={() => setIsPlayerReady(true)}
                    />
                  ) : (
                    <iframe
                      src={selectedVideo.href}
                      title={selectedVideo.title}
                      className={`h-full w-full border-0 transition-opacity duration-200 ${
                        isPlayerReady ? "opacity-100" : "pointer-events-none opacity-0"
                      }`}
                      allow="autoplay; fullscreen"
                      allowFullScreen
                      onLoad={() => setIsPlayerReady(true)}
                    />
                  )}

                  {!isPlayerReady ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[rgba(5,20,128,0.12)] text-white">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <p className="text-[0.8125rem] font-medium tracking-[-0.02em] text-white">
                        Loading player...
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="text-[0.8125rem] leading-[1.3] tracking-[-0.02em] text-[var(--color-text-muted)]">
                {selectedVideo.description}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
