"use client";

import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

import { useWelcomeAudiobookPlayer } from "@/components/dashboard/welcome-audiobook-player-context";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function WelcomeAudiobookPlayerBar() {
  const {
    tracks,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    playNext,
    playPrev,
    seek,
  } = useWelcomeAudiobookPlayer();

  const isVisible = currentTrack !== null;
  const progress = duration > 0 ? currentTime / duration : 0;
  const index = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < tracks.length - 1;

  function handleSeekClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    seek((e.clientX - rect.left) / rect.width);
  }

  return (
    <div
      role="region"
      aria-label="Audiobook player"
      className="fixed inset-x-0 bottom-0 z-[200] border-t border-zinc-200 bg-white shadow-[0_-8px_32px_rgba(6,16,86,0.12)] transition-transform duration-300"
      style={{ transform: isVisible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div
        className="h-1 w-full cursor-pointer bg-zinc-100"
        onClick={handleSeekClick}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[var(--color-brand-blue)]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="container-pleros flex max-w-[36rem] items-center gap-3 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-brand-blue)]">
          {currentTrack?.title ?? ""}
        </p>

        <span className="hidden shrink-0 text-[10px] tabular-nums text-zinc-400 sm:inline">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={playPrev}
            disabled={!hasPrev}
            aria-label="Previous chapter"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30"
          >
            <SkipBack className="size-4" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex size-9 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white transition-colors hover:bg-[var(--color-brand-blue-hover)]"
          >
            {isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="ml-0.5 size-4" />
            )}
          </button>
          <button
            type="button"
            onClick={playNext}
            disabled={!hasNext}
            aria-label="Next chapter"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-30"
          >
            <SkipForward className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
