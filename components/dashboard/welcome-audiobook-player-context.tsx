"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { WelcomeAudiobookTrack } from "@/lib/welcome-audiobook";

type WelcomeAudiobookPlayerContextType = {
  tracks: WelcomeAudiobookTrack[];
  currentTrack: WelcomeAudiobookTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playTrack: (track: WelcomeAudiobookTrack) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (pct: number) => void;
};

const WelcomeAudiobookPlayerCtx =
  createContext<WelcomeAudiobookPlayerContextType | null>(null);

export function WelcomeAudiobookPlayerProvider({
  tracks,
  children,
}: {
  tracks: WelcomeAudiobookTrack[];
  children: React.ReactNode;
}) {
  const [currentTrack, setCurrentTrack] = useState<WelcomeAudiobookTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackRef = useRef<WelcomeAudiobookTrack | null>(null);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Load + play whenever the selected track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = currentTrack.audioUrl;
    audio.play().catch(() => {});
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const playNext = useCallback(() => {
    setCurrentTrack((prev) => {
      if (!prev) return null;
      const idx = tracks.findIndex((t) => t.id === prev.id);
      return idx >= 0 && idx < tracks.length - 1 ? tracks[idx + 1] : prev;
    });
  }, [tracks]);

  const playPrev = useCallback(() => {
    setCurrentTrack((prev) => {
      if (!prev) return null;
      const idx = tracks.findIndex((t) => t.id === prev.id);
      return idx > 0 ? tracks[idx - 1] : prev;
    });
  }, [tracks]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDuration = () =>
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => playNext();
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [playNext]);

  const playTrack = useCallback((track: WelcomeAudiobookTrack) => {
    const audio = audioRef.current;
    const isSame = currentTrackRef.current?.id === track.id;
    if (isSame) {
      if (!audio) return;
      if (audio.paused) {
        audio.play().catch(() => {});
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }
    setCurrentTrack(track);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = pct * (audio.duration || 0);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const value = useMemo<WelcomeAudiobookPlayerContextType>(
    () => ({
      tracks,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      playTrack,
      togglePlay,
      playNext,
      playPrev,
      seek,
    }),
    [
      tracks,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      playTrack,
      togglePlay,
      playNext,
      playPrev,
      seek,
    ],
  );

  return (
    <WelcomeAudiobookPlayerCtx.Provider value={value}>
      <audio ref={audioRef} preload="metadata" />
      {children}
    </WelcomeAudiobookPlayerCtx.Provider>
  );
}

export function useWelcomeAudiobookPlayer(): WelcomeAudiobookPlayerContextType {
  const ctx = useContext(WelcomeAudiobookPlayerCtx);
  if (!ctx) {
    throw new Error(
      "useWelcomeAudiobookPlayer must be used inside <WelcomeAudiobookPlayerProvider>",
    );
  }
  return ctx;
}
