"use client";

import { useRef, useState } from "react";
import { Download, LoaderCircle, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { resolveMediaDownload } from "@/lib/media-download";
import { focusRing } from "@/components/dashboard/shared/ui";

function clock(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total / 60) % 60;
  return `${hours ? `${hours}:` : ""}${hours ? String(minutes).padStart(2, "0") : minutes}:${String(total % 60).padStart(2, "0")}`;
}

/** Media controls only. Progress persistence belongs to the caller. */
export function LessonAudioControls({ src, onProgress }: { src: string; onProgress?: (seconds: number, duration: number) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const download = resolveMediaDownload(src);
  const ready = duration > 0;
  const progress = ready ? Math.min(100, time / duration * 100) : 0;
  const smallControl = `relative grid size-9 shrink-0 place-items-center rounded-full text-(--color-brand-blue) transition-colors hover:bg-(--color-brand-sky) disabled:opacity-40 ${focusRing}`;

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
  }

  return <div className="grid gap-4" role="group" aria-label="Teaching audio controls">
    <audio ref={audioRef} src={src} preload="metadata"
      onLoadedMetadata={event => metadata(event.currentTarget)} onDurationChange={event => metadata(event.currentTarget)}
      onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); setWaiting(false); }}
      onPlaying={() => setWaiting(false)} onWaiting={() => setWaiting(true)}
      onVolumeChange={event => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
      onEnded={() => { setPlaying(false); setWaiting(false); }}
      onError={() => { setError("This audio could not load. Try again or download it."); setWaiting(false); setPlaying(false); }}
      onTimeUpdate={event => { const audio = event.currentTarget; setTime(audio.currentTime); onProgress?.(audio.currentTime, audio.duration); }} />
    <div className="flex items-center justify-center gap-4">
      <button type="button" disabled={!ready} onClick={() => seek(time - 15)} aria-label="Rewind 15 seconds" className={smallControl}><RotateCcw className="size-6" aria-hidden /><span aria-hidden className="absolute text-[9px] font-medium">15</span></button>
      <button type="button" onClick={toggle} aria-label={playing ? "Pause teaching" : "Play teaching"} className={`grid size-14 shrink-0 place-items-center rounded-full bg-(--color-brand-blue) text-white transition-colors hover:bg-(--color-brand-blue-hover) ${focusRing}`}>
        {waiting && playing ? <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden /> : playing ? <Pause className="size-6" aria-hidden /> : <Play className="ml-0.5 size-6" aria-hidden />}
      </button>
      <button type="button" disabled={!ready} onClick={() => seek(time + 15)} aria-label="Forward 15 seconds" className={smallControl}><RotateCw className="size-6" aria-hidden /><span aria-hidden className="absolute text-[9px] font-medium">15</span></button>
    </div>
    <div className="grid gap-1.5">
      <input type="range" min={0} max={100} step={0.1} value={progress} disabled={!ready} onChange={event => seek(Number(event.target.value) / 100 * duration)} aria-label="Seek teaching" aria-valuetext={`${clock(time)} of ${clock(duration)}`} className={`h-6 w-full cursor-pointer accent-(--color-brand-blue) disabled:opacity-40 ${focusRing}`} />
      <div className="flex items-center justify-between text-[11.5px] tabular-nums text-(--color-text-muted)"><span>{clock(time)}</span><span>{ready ? `−${clock(duration - time)}` : error ? "Audio unavailable" : "Loading audio…"}</span></div>
    </div>
    <div className="flex items-center justify-between gap-3 border-t border-(--color-line) pt-3">
      <label className="flex items-center gap-2 text-[12px] text-(--color-text-muted)">Speed
        <select aria-label="Playback speed" value={rate} onChange={event => { const value = Number(event.target.value); setRate(value); if (audioRef.current) audioRef.current.playbackRate = value; }} className="h-8 rounded-md border border-(--color-line-strong) bg-white pl-2 text-[12.5px] font-medium text-(--color-text-strong)">
          {[0.75, 1, 1.25, 1.5, 2].map(value => <option key={value} value={value}>{value}×</option>)}
        </select>
      </label>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={muted || volume === 0 ? "Unmute teaching" : "Mute teaching"} className={smallControl} onClick={() => { const audio = audioRef.current; if (!audio) return; if (volume === 0) { audio.volume = 1; audio.muted = false; } else audio.muted = !audio.muted; }}>
          {muted || volume === 0 ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        </button>
        <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={event => { if (audioRef.current) { audioRef.current.volume = Number(event.target.value); audioRef.current.muted = false; } }} aria-label="Teaching volume" className={`hidden h-6 w-16 accent-(--color-brand-blue) sm:block ${focusRing}`} />
      </div>
      {download ? <a href={download.href} download={download.attachment || undefined} target="_blank" rel="noreferrer" className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium text-(--color-brand-blue) hover:bg-(--color-brand-sky-soft) ${focusRing}`}><Download className="size-3.5" aria-hidden />{download.attachment ? "Download" : "Open audio"}</a> : null}
    </div>
    {error ? <div className="flex flex-wrap items-center gap-2 text-[12px]"><p role="alert" className="text-(--destructive)">{error}</p><button type="button" onClick={() => { setError(null); audioRef.current?.load(); }} className={`rounded-sm font-medium text-(--color-brand-blue) underline ${focusRing}`}>Reload audio</button></div> : null}
  </div>;
}
