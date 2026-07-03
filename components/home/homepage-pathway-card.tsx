import Image from "next/image";
import Link from "next/link";

import type { HomePathwayCard } from "../../lib/site-homepage-content";
import { Card, CardContent } from "../ui/card";
import { cn } from "../../lib/utils";

export function HomepagePathwayCard({
  title,
  description,
  mobileDescription,
  href,
  headerPrompt,
  headerPromptHighlightClassName,
  headerImageSrc,
  headerImageClassName,
  wordmarkImageSrc,
  surfaceClassName,
  headerClassName,
}: HomePathwayCard) {
  return (
    <Link href={href} className="group block min-w-0">
      <Card
        className={cn(
          "relative flex h-[12rem] flex-col gap-0 overflow-hidden rounded-[10.6px] border-0 p-0 shadow-none",
          surfaceClassName,
        )}
      >
        <div
          className={cn(
            "relative flex h-[45%] shrink-0 items-center justify-center",
            headerImageSrc && !headerPrompt ? "px-0" : "px-2.5",
            headerClassName,
          )}
        >
          {headerPrompt ? (
            <span
              className={cn(
                "max-w-full px-2 py-1.5 text-center font-[var(--font-sen)] text-[0.58rem] font-bold uppercase leading-[1.08] tracking-[0.03em] text-[var(--color-brand-blue)] sm:text-[0.62rem]",
                headerPromptHighlightClassName,
              )}
            >
              {headerPrompt}
            </span>
          ) : null}

          {headerImageSrc ? (
            <>
              <Image
                src={headerImageSrc}
                alt=""
                fill
                className={headerImageClassName ?? "p-2"}
                sizes="(max-width: 767px) 50vw, 249px"

              />
              <div
                className="pointer-events-none absolute inset-0 bg-black/12"
                aria-hidden="true"
              />
            </>
          ) : null}

          {wordmarkImageSrc ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={wordmarkImageSrc}
                alt=""
                width={95}
                height={46}
                className="h-[2.45rem] w-auto"
              />
            </div>
          ) : null}
        </div>

        <CardContent className="flex flex-1 flex-col justify-center gap-1 px-2 pb-1.5 pt-1 text-white sm:px-3 sm:pb-2 sm:pt-1.5">
          <div className="grid gap-1">
            <h2 className="site-pathway-title text-[1.05rem] leading-[0.98] tracking-[-0.02em] sm:text-[1.15rem]">
              {title}
            </h2>
            <p className="text-[0.72rem] leading-[1.2] font-medium tracking-[-0.018em] text-white/92 sm:text-[0.8rem]">
              {mobileDescription ?? description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
