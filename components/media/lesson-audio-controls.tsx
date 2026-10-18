"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { resolveMediaDownload } from "@/lib/media-download";
import { focusRing } from "@/components/dashboard/shared/ui";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function clock(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  return `${hours ? `${hours}:` : ""}${hours ? String(minutes).padStart(2, "0") : minutes}:${String(total % 60).padStart(2, "0")}`;
}

/** Media controls only. Progress persistence belongs to the caller. */
export function LessonAudioControls({ src, onProgress, initialPositionSeconds = 0, onSavePosition, label = "teaching", dashboard = false }: { src: string; onProgress?: (seconds: number, duration: number) => void; initialPositionSeconds?: number; onSavePosition?: (seconds: number) => void; label?: string; dashboard?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const restored = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(initialPositionSeconds);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const download = resolveMediaDownload(src);
  const ready = duration > 0;
  const progress = ready ? Math.min(100, time / duration * 100) : 0;
  const smallControl = `relative grid size-11 shrink-0 place-items-center rounded-full text-(--color-brand-blue) transition-colors hover:bg-(--color-brand-sky) disabled:opacity-40 ${focusRing}`;

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); return; }
    setError(null);
    try { await audio.play(); } catch { setError("Could not play this audio. Try again."); }
  }
  function seek(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    audio.currentTime = Math.max(0, Math.min(duration, seconds));
    setTime(audio.currentTime);
  }
  function metadata(audio: HTMLAudioElement) {
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.playbackRate = rate;
    if (!restored.current && Number.isFinite(audio.duration) && audio.duration > 0) {
      restored.current = true;
      audio.currentTime = Math.min(Math.max(0,initialPositionSeconds),audio.duration);
      setTime(audio.currentTime);
    }
  }

  return <div className="grid min-w-0 gap-4" data-dashboard-audio={dashboard || undefined} role="group" aria-label={`${label} audio controls`}>
    <audio ref={audioRef} src={src} preload="metadata"
      onLoadedMetadata={event => metadata(event.currentTarget)} onDurationChange={event => metadata(event.currentTarget)}
      onPlay={() => setPlaying(true)} onPause={event => { setPlaying(false); setWaiting(false); onSavePosition?.(event.currentTarget.currentTime); }}
      onSeeked={event => onSavePosition?.(event.currentTarget.currentTime)}
      onPlaying={() => setWaiting(false)} onWaiting={() => setWaiting(true)}
      onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
      onEnded={event => { setPlaying(false); setWaiting(false); onSavePosition?.(event.currentTarget.currentTime); }}
      onError={() => { setError("This audio could not load. Try again or download it."); setWaiting(false); setPlaying(false); }}
      onTimeUpdate={event => { const audio = event.currentTarget; setTime(audio.currentTime); onProgress?.(audio.currentTime, audio.duration); }} />
    {/* Podcast-player layout (Apple Podcasts, Brink, Waking Up on Mobbin, 18 October): the seek bar
        and times first, then one row where speed and download flank back 15, play and forward 15.
        No volume slider: phones use their hardware buttons. */}
    <div className="grid min-w-0 gap-1">
      <input type="range" min={0} max={100} step={0.1} value={progress} disabled={!ready} onChange={event => seek(Number(event.target.value) / 100 * duration)} aria-label={`Seek ${label}`} aria-valuetext={`${clock(time)} of ${clock(duration)}`} className={`h-6 block w-full min-w-0 cursor-pointer accent-(--color-brand-blue) disabled:opacity-40 ${focusRing}`} />
      <div className="flex items-center justify-between text-[12px] tabular-nums text-(--color-text-muted)"><span>{clock(time)}</span><span>{ready ? `−${clock(duration - time)}` : error ? "Audio unavailable" : "Loading audio…"}</span></div>
    </div>
    <div className="grid min-w-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="flex justify-start">
        <button type="button" onClick={() => { const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length]!; setRate(next); if (audioRef.current) audioRef.current.playbackRate = next; }}
          aria-label={`Playback speed ${rate}×. Tap to change.`} className={`inline-flex h-9 min-w-12 items-center justify-center rounded-full border border-(--color-line-strong) bg-white px-2.5 text-[13px] font-medium tabular-nums text-(--color-text-strong) transition-colors hover:border-(--color-brand-blue) ${focusRing}`}>{rate}×</button>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={!ready} onClick={() => seek(time - 15)} aria-label="Rewind 15 seconds" className={smallControl}><RotateCcw className="size-6" aria-hidden /><span aria-hidden className="absolute text-[9px] font-medium">15</span></button>
        <button type="button" onClick={toggle} aria-label={playing ? `Pause ${label}` : `Play ${label}`} className={`grid size-14 shrink-0 place-items-center rounded-full bg-(--color-brand-blue) text-white transition-colors hover:bg-(--color-brand-blue-hover) ${focusRing}`}>
          {waiting && playing ? <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden /> : playing ? <Pause className="size-6" aria-hidden /> : <Play className="ml-0.5 size-6" aria-hidden />}
        </button>
        <button type="button" disabled={!ready} onClick={() => seek(time + 15)} aria-label="Forward 15 seconds" className={smallControl}><RotateCw className="size-6" aria-hidden /><span aria-hidden className="absolute text-[9px] font-medium">15</span></button>
      </div>
      <div className="flex justify-end">
        {download
          ? <a href={download.href} download={download.attachment || undefined} target="_blank" rel="noreferrer" aria-label={`Download ${label} audio`} title="Download audio" className={smallControl}><Download className="size-5" aria-hidden /></a>
          : <button type="button" aria-label={muted || volume === 0 ? `Unmute ${label}` : `Mute ${label}`} className={smallControl} onClick={() => { const audio = audioRef.current; if (!audio) return; if (volume === 0) { audio.volume = 1; audio.muted = false; } else audio.muted = !audio.muted; }}>
            {muted || volume === 0 ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
          </button>}
      </div>
    </div>
    {error ? <div className="flex flex-wrap items-center gap-2 text-[12px]"><p role="alert" className="text-(--destructive)">{error}</p><button type="button" onClick={() => { setError(null); audioRef.current?.load(); }} className={`rounded-sm font-medium text-(--color-brand-blue) underline ${focusRing}`}>Reload audio</button></div> : null}
  </div>;
}
