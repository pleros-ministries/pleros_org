"use client";

import { Download, Pause, Play, Share2 } from "lucide-react";

import { CopyToClipboardButton } from "@/components/home/copy-to-clipboard-button";
import { useWelcomeAudiobookPlayer } from "@/components/dashboard/welcome-audiobook-player-context";
import { cn } from "@/lib/utils";

export function WelcomeAudiobookTrackList() {
  const { tracks, currentTrack, isPlaying, playTrack } = useWelcomeAudiobookPlayer();

  return (
    <div className="grid gap-2">
      {tracks.map((track) => {
        const isActive = currentTrack?.id === track.id;
        const shareValue =
          typeof window !== "undefined"
            ? `${window.location.origin}${window.location.pathname}#${track.id}`
            : `#${track.id}`;

        return (
          <div
            key={track.id}
            id={track.id}
            className={cn(
              "flex items-center gap-3 rounded-sm border p-3 transition-colors",
              isActive
                ? "border-[var(--color-brand-blue)] bg-[var(--color-brand-sky)]/40"
                : "border-zinc-200 bg-white",
            )}
          >
            <button
              type="button"
              onClick={() => playTrack(track)}
              aria-label={
                isActive && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
              }
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white transition-colors hover:bg-[var(--color-brand-blue-hover)]"
            >
              {isActive && isPlaying ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="ml-0.5 size-3.5" />
              )}
            </button>

            <p className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
              {track.title}
            </p>

            <CopyToClipboardButton
              value={shareValue}
              label={`Share link to ${track.title}`}
              icon={Share2}
            />

            <a
              href={track.audioUrl}
              download={`${track.title}.mp3`}
              title="Download"
              className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50"
            >
              <Download className="size-3.5" />
            </a>
          </div>
        );
      })}
    </div>
  );
}
