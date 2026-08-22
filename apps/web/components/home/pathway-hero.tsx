"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { heroSlides, pathwayCards } from "../../lib/homepage-content";
import { getNextCarouselIndex, type PathwayKey } from "../../lib/homepage-logic";
import { cn } from "../../lib/utils";

function PathwayArtwork({ pathway }: { pathway: PathwayKey }) {
  return (
    <div
      className={cn(
        "pathway-art",
        pathway === "questions" && "pathway-art--questions",
        pathway === "purpose" && "pathway-art--purpose",
        pathway === "fulfil" && "pathway-art--fulfil",
      )}
      aria-hidden="true"
    >
      <div className="pathway-art__wash" />
      <div className="pathway-art__shape pathway-art__shape--a" />
      <div className="pathway-art__shape pathway-art__shape--b" />
      <div className="pathway-art__shape pathway-art__shape--c" />
      <div className="pathway-art__shape pathway-art__shape--d" />
    </div>
  );
}

export function PathwayHero() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);

  const activeSlide = useMemo(
    () => heroSlides[activeSlideIndex] ?? heroSlides[0],
    [activeSlideIndex],
  );
  const activeQuestion = activeSlide?.question ?? "";

  useEffect(() => {
    if (!activeQuestion) {
      return undefined;
    }

    if (typedLength < activeQuestion.length) {
      const typingTimer = window.setTimeout(
        () => setTypedLength((count) => count + 1),
        typedLength === 0 ? 260 : 36,
      );

      return () => window.clearTimeout(typingTimer);
    }

    if (heroSlides.length <= 1) {
      return undefined;
    }

    const holdTimer = window.setTimeout(() => {
      setActiveSlideIndex((current) =>
        getNextCarouselIndex(current, heroSlides.length),
      );
      setTypedLength(0);
    }, 1750);

    return () => window.clearTimeout(holdTimer);
  }, [activeQuestion, typedLength]);

  const activePathway = useMemo(() => activeSlide?.pathway, [activeSlide]);
  const typedQuestion = activeQuestion.slice(0, typedLength);
  const isTypingComplete = typedLength >= activeQuestion.length;
  const promptTextClassName =
    "text-left text-[clamp(1.9rem,7.2vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.022em] text-[var(--color-text-strong)]";

  return (
    <section className="pb-8 pt-5 sm:pb-10 sm:pt-7 md:pb-12 md:pt-10">
      <div className="container-pleros grid gap-4 sm:gap-6">
        <div className="mx-auto grid w-full max-w-4xl gap-2.5">
          <p className="w-fit whitespace-nowrap text-[0.68rem] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            Pleros Ministries &amp; Missions
          </p>

          <div
            className="relative w-full max-w-[22.5rem] sm:max-w-[25rem] md:max-w-[33rem]"
            aria-live="polite"
          >
            <div className="grid" aria-hidden="true">
              {heroSlides.map((slide) => (
                <p key={slide.question} className={cn("invisible row-start-1 col-start-1", promptTextClassName)}>
                  {slide.question}
                </p>
              ))}
            </div>

            <p className={cn("pointer-events-none absolute inset-0", promptTextClassName)}>
              {typedQuestion}
              <span
                aria-hidden="true"
                className={cn(
                  "ml-0.5 inline-block h-[0.92em] w-px translate-y-[0.09em] align-baseline bg-[var(--color-text-strong)]/70 transition-opacity duration-200",
                  isTypingComplete ? "opacity-30" : "animate-pulse opacity-100",
                )}
              />
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {pathwayCards.map((pathway) => {
            const isActive = activePathway === pathway.key;

            return (
              <Link
                key={pathway.key}
                href={pathway.href}
                className={cn(
                  "pleros-pathway-card !min-h-[7.35rem] !p-3.5 md:!min-h-[16rem] md:!p-5",
                  pathway.themeClass,
                  isActive && "is-active",
                )}
              >
                <div className="relative z-10 flex min-h-0 items-center gap-3 md:grid md:grid-rows-[9.8rem_auto] md:gap-4">
                  <PathwayArtwork pathway={pathway.key} />
                  <div className="grid min-w-0 gap-1 md:gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="pathway-card__title text-[1rem] font-semibold leading-[1.16] tracking-[-0.015em] md:text-[1.25rem]">
                        {pathway.title}
                      </h2>
                      <span className="pathway-card__cue shrink-0 text-sm leading-none">
                        ↗
                      </span>
                    </div>
                    <p className="pathway-card__copy text-sm leading-[1.35] md:hidden">
                      {pathway.mobileDescription}
                    </p>
                    <p className="pathway-card__copy body hidden md:block">
                      {pathway.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
