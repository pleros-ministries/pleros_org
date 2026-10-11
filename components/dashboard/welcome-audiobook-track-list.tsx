"use client";

import { Download, Pause, Play, Share2 } from "lucide-react";

import { CopyToClipboardButton } from "@/components/home/copy-to-clipboard-button";
import { useWelcomeAudiobookPlayer } from "@/components/dashboard/welcome-audiobook-player-context";
import { cn } from "@/lib/utils";

export function WelcomeAudiobookTrackList() {
  const { tracks, currentTrack, isPlaying, playTrack } = useWelcomeAudiobookPlayer();

  return (
    <ol className="divide-y divide-(--color-line) overflow-hidden rounded-[var(--radius-lg)] border border-(--color-line) bg-white">
      {tracks.map((track, index) => {
        const isActive = currentTrack?.id === track.id;
        const shareValue =
          typeof window !== "undefined"
            ? `${window.location.origin}${window.location.pathname}#${track.id}`
            : `#${track.id}`;

        return (
          <li
            key={track.id}
            id={track.id}
            className={cn(
              "flex items-center gap-3 p-3 transition-colors",
              isActive
                ? "bg-(--color-brand-sky-soft)"
                : "bg-white",
            )}
          >
            <button
              type="button"
              onClick={() => playTrack(track)}
              aria-label={
                isActive && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
              }
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-brand-sky) text-(--color-brand-blue) transition-colors hover:bg-(--color-brand-sky-soft)"
            >
              {isActive && isPlaying ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="ml-0.5 size-3.5" />
              )}
            </button>

            <span className="w-5 shrink-0 text-[12px] tabular-nums text-(--color-text-muted)">{index + 1}</span>
            <p className="min-w-0 flex-1 text-[13.5px] font-medium text-(--color-text-strong)">
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
          </li>
        );
      })}
    </ol>
  );
}
