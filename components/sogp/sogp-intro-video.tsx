"use client";

import { Play } from "lucide-react";
import { useRef, useState } from "react";

type SogpIntroVideoProps = {
  src: string;
  title: string;
  posterSrc: string;
};

export function SogpIntroVideo({
  src,
  title,
  posterSrc,
}: SogpIntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function playVideo() {
    setIsPlaying(true);
    void videoRef.current?.play();
  }

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[19rem] overflow-hidden rounded-[1.5rem] border-[6px] border-white/90 bg-black shadow-[0_26px_70px_rgba(0,0,0,0.28)] md:max-w-[21rem]">
      <video
        ref={videoRef}
        src={src}
        poster={posterSrc}
        aria-label={title}
        className="absolute inset-0 h-full w-full object-cover"
        controls={isPlaying}
        playsInline
        preload="metadata"
      >
        Your browser does not support embedded video.
      </video>
      {!isPlaying ? (
        <button
          type="button"
          onClick={playVideo}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 grid place-items-center overflow-hidden bg-[linear-gradient(180deg,rgba(5,20,128,0.06)_0%,rgba(5,20,128,0.38)_100%)] focus-visible:outline-4 focus-visible:outline-offset-[-8px] focus-visible:outline-[var(--color-brand-lime)]"
        >
          <span className="relative grid size-16 place-items-center rounded-full bg-white text-[var(--color-brand-blue)] shadow-[0_12px_30px_rgba(0,0,0,0.22)] transition-transform duration-200 group-hover:scale-105">
            <Play className="ml-1 size-6 fill-current" aria-hidden="true" />
          </span>
        </button>
      ) : null}
    </div>
  );
}
