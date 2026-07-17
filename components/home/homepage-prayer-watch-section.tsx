"use client";

import { PlayIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  PRAYER_WATCH_EMBED_URL,
  PRAYER_WATCH_THUMBNAIL_URL,
  PRAYER_WATCH_YOUTUBE_URL,
} from "../../lib/prayer-watch";

export function HomepagePrayerWatchSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  function playStream() {
    setIsPlayerReady(false);
    setIsPlaying(true);
  }

  return (
    <section
      id="prayer-watch"
      className="bg-[var(--color-brand-blue)] px-[1.3125rem] py-[4.5625rem] text-center text-white lg:px-16 lg:py-24"
    >
      <div className="grid gap-[8]">
        <div className="grid justify-items-center gap-[0.8125rem]">
          <h2 className="site-section-heading max-w-[33.5625rem] text-white">
            Maintain Devotional and Prayer Consistency.
          </h2>
          <p className="site-section-intro max-w-[28.125rem] text-white/90">
            Join every Pleros Prayer Watch session on YouTube.
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-[40rem] gap-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-[1.25rem] bg-[var(--color-brand-indigo)]">
            {isPlaying ? (
              <>
                <iframe
                  src={PRAYER_WATCH_EMBED_URL}
                  title="Pleros Prayer Watch — Evening Session"
                  className={`h-full w-full border-0 transition-opacity duration-200 ${isPlayerReady ? "opacity-100" : "pointer-events-none opacity-0"
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
              </>
            ) : (
              <>
                <Image
                  src={PRAYER_WATCH_THUMBNAIL_URL}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 100vw, 40rem"
                />
                <div className="absolute inset-0 bg-[rgba(5,20,128,0.28)]" />
                <button
                  type="button"
                  onClick={playStream}
                  aria-label="Play a recent Prayer Watch session"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px">
                    <PlayIcon className="size-6 fill-current stroke-current" />
                  </span>
                </button>
              </>
            )}
          </div>

          <p className="text-[0.8125rem] leading-[1.4] tracking-[-0.02em] text-white/70">
            Watch a recent Prayer Watch session, or subscribe below to join us
            live next time.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href={PRAYER_WATCH_YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)]"
          >
            Subscribe now
          </Link>
        </div>
      </div>
    </section>
  );
}
