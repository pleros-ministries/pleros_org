"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { HomeCarouselSlide } from "../../lib/site-homepage-content";

const AUTOPLAY_INTERVAL_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

type HomepageCarouselProps = {
  slides: readonly HomeCarouselSlide[];
};

export function HomepageCarousel({ slides }: HomepageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [slides.length, isPaused]);

  function goToIndex(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, slides.length - 1)));
  }

  function goToPrevious() {
    setActiveIndex((current) => current === 0 ? 0 : current - 1);
  }

  function goToNext() {
    setActiveIndex((current) => (current + 1) % slides.length);
  }

  function handleSwipeEnd(clientX: number) {
    if (swipeStartX === null) return;

    const deltaX = clientX - swipeStartX;
    setSwipeStartX(null);
    setIsPaused(false);

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;

    if (deltaX < 0) {
      goToNext();
      return;
    }

    goToPrevious();
  }

  if (!slides.length) return null;

  return (
    <div
      className="relative overflow-hidden lg:mx-auto lg:max-w-[40vw]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(event) => {
        setIsPaused(true);
        setSwipeStartX(event.touches[0]?.clientX ?? null);
      }}
      onTouchEnd={(event) => {
        handleSwipeEnd(event.changedTouches[0]?.clientX ?? swipeStartX ?? 0);
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "touch") return;
        setIsPaused(true);
        setSwipeStartX(event.clientX);
      }}
      onPointerUp={(event) => {
        if (event.pointerType === "touch") return;
        handleSwipeEnd(event.clientX);
      }}
      onPointerCancel={() => {
        setSwipeStartX(null);
        setIsPaused(false);
      }}
    >
      <div
        className="flex pb-1 transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <Link
            key={slide.id}
            href={slide.href}
            aria-hidden={index !== activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            className="flex w-full shrink-0 items-center justify-center px-4 text-center transition-transform duration-150 hover:-translate-y-px sm:py-1 lg:py-2"
          >
            <p className="site-hero-heading max-w-[26rem] text-[var(--color-brand-blue)]">
              {slide.text}
            </p>
          </Link>
        ))}
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Previous slide"
            disabled={activeIndex === 0}
            className="absolute left-1 top-1/2  -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-[var(--color-brand-blue)] shadow-md transition-opacity duration-150 disabled:opacity-0 sm:flex"
          >
            <ChevronLeftIcon className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Next slide"
            className="absolute right-1 top-1/2  -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-[var(--color-brand-blue)] shadow-md transition-opacity duration-150 disabled:opacity-0 sm:flex"
          >
            <ChevronRightIcon className="size-4.5" />
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-150 ${index === activeIndex
                  ? "w-5 bg-[var(--color-brand-blue)]"
                  : "w-1.5 bg-[var(--color-brand-blue)]/25"
                  }`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
