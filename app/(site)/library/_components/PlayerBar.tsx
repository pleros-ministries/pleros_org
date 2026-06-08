"use client";

import Image from "next/image";
import { DownloadIcon, SkipBackIcon, SkipForwardIcon, Volume2Icon } from "lucide-react";

import { usePlayer } from "./PlayerContext";

function formatTime(s: number): string {
  if (!Number.isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
  } = usePlayer();

  const progress = duration > 0 ? currentTime / duration : 0;
  const isVisible = currentTrack !== null;

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - rect.left) / rect.width);
  }

  return (
    <div
      role="region"
      aria-label="Audio player"
      className="fixed bottom-0 left-0 right-0 z-[200] flex flex-col border-t border-[#e8e8ee] bg-white transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)]"
      style={{
        boxShadow: "0 -8px 32px rgba(0,0,0,0.08)",
        transform: isVisible ? "translateY(0)" : "translateY(100%)",
        fontFamily: "var(--font-figtree, sans-serif)",
      }}
    >
      {/* ── Progress strip — mobile only ─────────────────────────── */}
      <div
        className="h-[3px] w-full cursor-pointer bg-[#f1f1f5] md:hidden"
        onClick={handleProgressClick}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-[#0d1b5e]" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* ── Main row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 md:gap-6 md:px-7" style={{ height: 72 }}>

        {/* Left: thumbnail + title (flex-1 on mobile, fixed on desktop) */}
        <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[240px] md:flex-none md:shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#011585] p-2">
            <Image
              src="/site/home/assets/pleros-wordmark.png"
              alt="Pleros"
              width={40}
              height={40}
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-[700] text-[#0d1b5e]">
              {currentTrack?.title ?? ""}
            </p>
            <p className="truncate text-[11px] font-[500] text-[#8888a0]">
              {currentTrack?.series ?? ""}
            </p>
          </div>
        </div>

        {/* Mobile controls — prev/play/next only, no scrubber */}
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <button
            type="button"
            onClick={playPrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#444450] transition-colors hover:bg-[#f1f1f5]"
          >
            <SkipBackIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b5e] text-white transition-colors hover:bg-[#1a2f8a]"
          >
            {isPlaying ? (
              <svg className="size-4 fill-white" viewBox="0 0 24 24" aria-hidden>
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="size-4 fill-white" viewBox="0 0 24 24" aria-hidden>
                <path d="M5 3.5a.5.5 0 0 1 .765-.424l14 8a.5.5 0 0 1 0 .848l-14 8A.5.5 0 0 1 5 19.5v-16Z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={playNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#444450] transition-colors hover:bg-[#f1f1f5]"
          >
            <SkipForwardIcon className="size-4" />
          </button>
        </div>

        {/* Desktop center: controls + scrubber */}
        <div className="hidden flex-1 flex-col items-center gap-2 md:flex">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playPrev}
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#444450] transition-colors hover:bg-[#f1f1f5]"
            >
              <SkipBackIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0d1b5e] text-white transition-colors hover:bg-[#1a2f8a]"
            >
              {isPlaying ? (
                <svg className="size-4 fill-white" viewBox="0 0 24 24" aria-hidden>
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="size-4 fill-white" viewBox="0 0 24 24" aria-hidden>
                  <path d="M5 3.5a.5.5 0 0 1 .765-.424l14 8a.5.5 0 0 1 0 .848l-14 8A.5.5 0 0 1 5 19.5v-16Z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={playNext}
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#444450] transition-colors hover:bg-[#f1f1f5]"
            >
              <SkipForwardIcon className="size-4" />
            </button>
          </div>

          {/* Scrubber */}
          <div className="flex w-full max-w-[480px] items-center gap-2.5">
            <span className="min-w-[32px] text-[10px] font-[600] tabular-nums text-[#8888a0]">
              {formatTime(currentTime)}
            </span>
            <div
              className="group relative flex-1 cursor-pointer"
              onClick={handleProgressClick}
              role="slider"
              aria-label="Seek"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-1 overflow-hidden rounded-full bg-[#f1f1f5]">
                <div
                  className="h-full rounded-full bg-[#0d1b5e] transition-[width] duration-100 group-hover:bg-[#2563eb]"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
            <span className="min-w-[32px] text-right text-[10px] font-[600] tabular-nums text-[#8888a0]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Desktop right: volume + download */}
        <div className="hidden min-w-[180px] shrink-0 items-center justify-end gap-3.5 md:flex">
          <div className="flex items-center gap-2">
            <Volume2Icon className="size-4 shrink-0 text-[#8888a0]" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
              className="w-[72px] accent-[#0d1b5e]"
            />
          </div>
          {currentTrack && (
            <a
              href={currentTrack.audioUrl}
              download={`${currentTrack.title}.mp3`}
              aria-label="Download"
              className="flex h-[34px] items-center gap-1.5 rounded-lg border-[1.5px] border-[#d4d4de] px-3.5 text-[12px] font-[600] text-[#444450] transition-all hover:border-[#2563eb] hover:bg-[#eff4ff] hover:text-[#2563eb]"
            >
              <DownloadIcon className="size-3.5" />
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
