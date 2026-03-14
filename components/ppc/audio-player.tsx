"use client";

import { useRef, useState, useEffect } from "react";
import { Download, Pause, Play } from "lucide-react";

type AudioPlayerProps = {
  src: string;
  title?: string;
  onListened?: () => void;
};

export function AudioPlayer({ src, title, onListened }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      setProgress(audio.currentTime);
      if (!notified && audio.duration > 0 && audio.currentTime / audio.duration > 0.9) {
        setNotified(true);
        onListened?.();
      }
    };
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [notified, onListened]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 rounded-sm border border-zinc-200 bg-white px-3 py-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="truncate text-xs font-medium text-zinc-700">{title}</p>}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={progress}
          onChange={seek}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900"
        />
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <a
        href={src}
        download
        className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
        title="Download"
      >
        <Download className="size-3.5" />
      </a>
    </div>
  );
}
