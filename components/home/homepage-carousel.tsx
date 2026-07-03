"use client";

import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { HomeCarouselSlide } from "../../lib/site-homepage-content";

const AUTOPLAY_INTERVAL_MS = 4500;

type HomepageCarouselProps = {
  slides: readonly HomeCarouselSlide[];
};

export function HomepageCarousel({ slides }: HomepageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % slides.length;
        const slide = trackRef.current?.children[next] as HTMLElement | undefined;
        slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        return next;
      });
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, activeIndex]);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;

    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;

    const { scrollLeft, children } = track;
    let closestIndex = 0;
    let closestDistance = Infinity;

    Array.from(children).forEach((child, index) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }

  if (!slides.length) return null;

  return (
    <div
      className="relative lg:mx-auto lg:max-w-[40vw]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1"
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="flex w-full shrink-0 snap-center items-center justify-center px-4 text-center transition-transform duration-150 hover:-translate-y-px sm:py-1 lg:py-2"
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
            onClick={() => scrollToIndex(activeIndex - 1)}
            aria-label="Previous slide"
            disabled={activeIndex === 0}
            className="absolute left-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-[var(--color-brand-blue)] shadow-md transition-opacity duration-150 disabled:opacity-0 sm:flex"
          >
            <ChevronLeftIcon className="size-4.5" />
          </button>

          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            aria-label="Next slide"
            disabled={activeIndex === slides.length - 1}
            className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2 text-[var(--color-brand-blue)] shadow-md transition-opacity duration-150 disabled:opacity-0 sm:flex"
          >
            <ChevronRightIcon className="size-4.5" />
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollToIndex(index)}
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
