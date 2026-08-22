"use client";

import {
  MoonIcon,
  PlayIcon,
  SunIcon,
  SunriseIcon,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getNextPrayerWatchSessionId,
  PRAYER_WATCH_EMBED_URL,
  PRAYER_WATCH_SESSIONS,
  PRAYER_WATCH_YOUTUBE_URL,
  type PrayerWatchSessionId,
} from "../../lib/prayer-watch";

const PRAYER_WATCH_POSTER_SRC =
  "/site/home/assets/dashboard-cards/4-prayer-watch-bg.webp";

const prayerWatchSessionIcons: Record<PrayerWatchSessionId, LucideIcon> = {
  morning: SunriseIcon,
  afternoon: SunIcon,
  evening: MoonIcon,
};

export function HomepagePrayerWatchSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [nextSessionId, setNextSessionId] =
    useState<PrayerWatchSessionId | null>(null);
  const nextSession = PRAYER_WATCH_SESSIONS.find(
    (item) => item.id === nextSessionId,
  );

  useEffect(() => {
    function updateNextSession() {
      setNextSessionId(getNextPrayerWatchSessionId());
    }

    updateNextSession();
    const interval = window.setInterval(updateNextSession, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  function playStream() {
    setIsPlayerReady(false);
    setIsPlaying(true);
  }

  return (
    <section
      id="prayer-watch"
      className="bg-[var(--color-brand-blue)] px-[1.3125rem] py-16 text-center text-white md:py-20 lg:px-16 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-[42rem] justify-items-center gap-7 md:gap-8 lg:gap-10">
        <div className="grid justify-items-center gap-3">
          <h2 className="site-section-heading max-w-[33.5625rem] text-white">
            Maintain Devotional and Prayer Consistency
          </h2>
          <p className="site-section-intro max-w-[28.125rem] text-white/90">
            Join every Pleros Prayer Watch session on YouTube
          </p>
          <dl
            aria-label="Prayer Watch session times"
            className="w-full max-w-[30rem] overflow-hidden rounded-[0.375rem] border-[0.5px] border-[#D6F4FC] bg-[#F2FCFF] text-[var(--color-brand-blue)]"
          >
            <div
              aria-live="polite"
              className="flex min-h-9 items-center justify-center gap-2 border-b-[0.5px] border-[#A9DDF0] bg-[#BCEAFF] px-3 py-2 text-[0.625rem] leading-none font-bold tracking-[0.1em] uppercase"
            >
              <span>Next session</span>
              {nextSession ? (
                <>
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-current"
                  />
                  <span>
                    {nextSession.label} {nextSession.time}
                  </span>
                </>
              ) : null}
            </div>
            <div className="grid grid-cols-3">
              {PRAYER_WATCH_SESSIONS.map((item, index) => {
                const Icon = prayerWatchSessionIcons[item.id];
                const isNextSession = item.id === nextSessionId;
                const isAdjacentToNextSession =
                  PRAYER_WATCH_SESSIONS[index + 1]?.id === nextSessionId;
                const segmentClassName = [
                  "relative min-w-0 px-2 py-3 transition-colors duration-200",
                  isNextSession || isAdjacentToNextSession
                    ? "after:hidden"
                    : "after:absolute after:inset-y-3 after:right-0 after:w-[0.5px] after:bg-[rgba(5,20,128,0.08)] last:after:hidden",
                  isNextSession
                    ? "bg-[var(--color-brand-lime)]"
                    : "bg-transparent",
                ].join(" ");

                return (
                  <div key={item.label} className={segmentClassName}>
                    <Icon
                      aria-hidden="true"
                      className="mx-auto mb-1.5 size-4 stroke-[2.25]"
                    />
                    <dt className="text-[0.5625rem] leading-none font-semibold tracking-[0.12em] uppercase">
                      {item.label}
                    </dt>
                    <dd className="mt-1.5 text-[0.875rem] leading-none font-semibold tracking-[-0.02em]">
                      {item.time}
                    </dd>
                  </div>
                );
              })}
            </div>
          </dl>
        </div>

        <div className="w-full">
          <div className="relative aspect-video w-full overflow-hidden rounded-[0.875rem] bg-[var(--color-brand-indigo)]">
            {isPlaying ? (
              <>
                <iframe
                  src={PRAYER_WATCH_EMBED_URL}
                  title="Pleros Prayer Watch — Evening Session"
                  className={`h-full w-full border-0 transition-opacity duration-200 ${
                    isPlayerReady
                      ? "opacity-100"
                      : "pointer-events-none opacity-0"
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
                  src={PRAYER_WATCH_POSTER_SRC}
                  alt=""
                  fill
                  className="object-cover object-[50%_42%]"
                  sizes="(max-width: 767px) 100vw, 40rem"
                />
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
        </div>

        <Link
          href={PRAYER_WATCH_YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-lime)] px-7 py-2.5 text-[0.875rem] leading-none font-semibold text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
        >
          Subscribe now
        </Link>
      </div>
    </section>
  );
}
