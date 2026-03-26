"use client";

import Image from "next/image";
import { XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PurposePathwayVideoItem } from "@/lib/purpose-pathway-content";

function PurposeVideoCard({
  title,
  description,
  thumbnailSrc,
  playIconSrc,
  onPlay,
}: PurposePathwayVideoItem & {
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className="group grid gap-3.5 text-left"
      aria-label={`Play ${title}`}
    >
      <div className="relative aspect-[493/263] overflow-hidden rounded-[0.6875rem] bg-[#d98d54] shadow-[var(--shadow-sm)]">
        <Image
          src={thumbnailSrc}
          alt=""
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-[1.015]"
          sizes="(max-width: 767px) calc(100vw - 5.5rem), (max-width: 1279px) 31rem, 35rem"
        />
        <div className="absolute inset-0 bg-black/12 transition-colors duration-200 group-hover:bg-black/18" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={playIconSrc}
            alt=""
            width={84}
            height={84}
            className="h-[4.75rem] w-[4.75rem] transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </div>
      </div>

      <div className="grid gap-1.5 text-left">
        <h2 className="font-[var(--font-sen)] text-[1.125rem] font-semibold leading-[1.02] tracking-[-0.03em] text-[var(--color-brand-indigo)] md:text-[1.35rem]">
          {title}
        </h2>
        <p className="max-w-[18rem] text-[0.75rem] leading-[1.18] tracking-[-0.02em] text-[var(--color-text-muted)] md:max-w-[22rem] md:text-[0.875rem]">
          {description}
        </p>
      </div>
    </button>
  );
}

export function PurposeVideoGallery({
  videos,
}: {
  videos: PurposePathwayVideoItem[];
}) {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId, videos],
  );

  return (
    <>
      <div className="mx-auto grid max-w-[30.8125rem] gap-[2.875rem] md:max-w-[38rem] xl:max-w-[49rem] xl:gap-[3.25rem]">
        {videos.map((video) => (
          <PurposeVideoCard
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
