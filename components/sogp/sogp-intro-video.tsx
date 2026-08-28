"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";

type SogpIntroVideoProps = {
  videoId: string;
  title: string;
  thumbnailSrc: string;
};

export function SogpIntroVideo({
  videoId,
  title,
  thumbnailSrc,
}: SogpIntroVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[19rem] overflow-hidden rounded-[1.5rem] border-[6px] border-white/90 bg-black shadow-[0_26px_70px_rgba(0,0,0,0.28)] md:max-w-[21rem]">
      {isPlaying ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 grid place-items-center overflow-hidden focus-visible:outline-4 focus-visible:outline-offset-[-8px] focus-visible:outline-[var(--color-brand-lime)]"
        >
          <Image
            src={thumbnailSrc}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 767px) 19rem, 21rem"
          />
          <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,128,0.06)_0%,rgba(5,20,128,0.38)_100%)]" />
          <span className="relative grid size-16 place-items-center rounded-full bg-white text-[var(--color-brand-blue)] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition-transform duration-200 group-hover:scale-105">
            <Play className="ml-1 size-6 fill-current" aria-hidden="true" />
          </span>
        </button>
      )}
    </div>
  );
}
