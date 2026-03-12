"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MessageCircleIcon,
  RouteIcon,
  SparklesIcon,
  SproutIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { heroSlides, pathwayCards } from "@/lib/homepage-content";
import { getNextCarouselIndex, type PathwayKey } from "@/lib/homepage-logic";

function PathwayIllustration({ pathway }: { pathway: PathwayKey }) {
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--page-accent-ring)] bg-[linear-gradient(140deg,var(--page-accent-soft),rgba(255,255,255,0.78))] md:h-36 md:w-full">
      <div className="absolute -top-4 -right-4 h-12 w-12 rounded-full bg-white/55" />
      <div className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full bg-white/45" />

      {pathway === "questions" ? (
        <>
          <SparklesIcon className="absolute top-3 left-3 size-4 text-[var(--page-accent)] md:size-5" />
          <MessageCircleIcon className="absolute right-3 bottom-3 size-5 text-[var(--page-accent)] md:size-7" />
          <div className="absolute left-7 top-8 h-1.5 w-1.5 rounded-full bg-[var(--page-accent)] opacity-70" />
          <div className="absolute left-10 top-11 h-1.5 w-1.5 rounded-full bg-[var(--page-accent)] opacity-60" />
        </>
      ) : null}

      {pathway === "purpose" ? (
        <>
          <SproutIcon className="absolute left-4 top-4 size-5 text-[var(--page-accent)] md:size-7" />
          <div className="absolute left-1/2 bottom-0 h-14 w-px -translate-x-1/2 bg-[var(--page-accent)] opacity-45 md:h-20" />
          <div className="absolute right-4 top-11 h-2.5 w-2.5 rounded-full bg-[var(--page-accent)] opacity-55" />
          <div className="absolute right-7 top-[3.6rem] h-1.5 w-1.5 rounded-full bg-[var(--page-accent)] opacity-40" />
        </>
      ) : null}

      {pathway === "fulfil" ? (
        <>
          <RouteIcon className="absolute left-3 top-3 size-5 text-[var(--page-accent)] md:size-7" />
          <svg
            className="absolute right-2 bottom-2 h-10 w-10 text-[var(--page-accent)] opacity-55 md:h-14 md:w-14"
            viewBox="0 0 56 56"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 46C18 31 26 38 32 25C36 16 44 14 50 8"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </>
      ) : null}
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

  const activePathway = useMemo(
    () => activeSlide?.pathway,
    [activeSlide],
  );
  const typedQuestion = activeQuestion.slice(0, typedLength);
  const isTypingComplete = typedLength >= activeQuestion.length;

  return (
    <section className="pt-5 pb-8 sm:pt-7 sm:pb-10 md:pt-10 md:pb-12">
      <div className="container-pleros grid gap-4 sm:gap-6">
        <div className="mx-auto grid w-full max-w-4xl gap-2.5">
          <p className="w-fit whitespace-nowrap text-[0.68rem] font-medium tracking-[0.12em] text-[var(--color-text-muted)] uppercase">
            Pleros Ministries &amp; Missions
          </p>

          <div className="relative min-h-[5.35rem] sm:min-h-[5.8rem]" aria-live="polite">
            <p className="max-w-[24ch] text-left text-[clamp(1.9rem,7.2vw,3.4rem)] leading-[1.02] font-semibold tracking-[-0.022em] text-[var(--color-text-strong)]">
              {typedQuestion}
              <span
                aria-hidden="true"
                className={cn(
                  "ml-0.5 inline-block h-[0.92em] w-px translate-y-[0.09em] bg-[var(--color-text-strong)]/70 align-baseline transition-opacity duration-200",
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
                <div className="flex min-h-0 items-center gap-3 md:grid md:grid-rows-[9.25rem_auto] md:gap-4">
                  <PathwayIllustration pathway={pathway.key} />
                  <div className="grid min-w-0 gap-1 md:gap-1.5">
                    <h2 className="text-[1rem] leading-[1.18] font-semibold tracking-[-0.01em] text-[var(--color-text-strong)] md:text-[1.25rem]">
                      {pathway.title}
                    </h2>
                    <p className="text-sm leading-[1.35] text-[var(--color-text-muted)] md:hidden">
                      {pathway.mobileDescription}
                    </p>
                    <p className="body hidden text-[var(--color-text-muted)] md:block">
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
